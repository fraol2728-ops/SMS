"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/campus";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { generateReport } from "@/lib/reports";
import {
  courseSchema,
  studentSchema,
  teacherSchema,
  updateStudentSchema,
  updateTeacherSchema,
  updateClassSchema,
} from "@/lib/validations/admin";

const ok = { success: true as const };
const err = (error: string) => ({ success: false as const, error });

type ActionInput =
  | FormData
  | Record<string, FormDataEntryValue | number | boolean | undefined>;

type StudentCreationTransaction = {
  user: { create: typeof prisma.user.create };
  payment: { create: typeof prisma.payment.create };
};

type ClassTransferTransaction = {
  enrollment: { update: typeof prisma.enrollment.update };
  attendance: { updateMany: typeof prisma.attendance.updateMany };
};

function actionInputToObject(input: ActionInput) {
  return input instanceof FormData
    ? Object.fromEntries(input.entries())
    : input;
}

function emptyToUndefined(value: unknown) {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

function parseBoolean(
  value: FormDataEntryValue | number | boolean | undefined,
  defaultValue?: boolean,
) {
  if (typeof value === "boolean") return value;
  if (value === undefined) return defaultValue;
  return value === "true";
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function generateSlug(title: string): string {
  const suffix = Math.random().toString(36).substring(2, 7);
  return `${slugify(title)}-${suffix}`;
}

async function getCurrentAdminCampusId(): Promise<string | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { campusId: true, role: true },
    });
    if (user?.role === "SUPER_ADMIN") return null;
    return user?.campusId ?? null;
  } catch {
    return null;
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function createStudent(input: ActionInput) {
  try {
    const raw = actionInputToObject(input);
    const v = studentSchema.parse({
      ...raw,
      email: raw.email ?? "",
      gender: emptyToUndefined(raw.gender),
      dateOfBirth: emptyToUndefined(raw.dateOfBirth),
      paymentMethod: emptyToUndefined(raw.paymentMethod),
      paymentAmount: Number(raw.paymentAmount),
    });

    const currentUser = await getCurrentUser();
    if (!currentUser || !["ADMIN", "SUPER_ADMIN"].includes(currentUser.role)) {
      return err("Not authorized.");
    }
    const adminCampusId =
      currentUser.role === "SUPER_ADMIN" ? null : currentUser.campusId;

    const studentCount = await prisma.studentProfile.count();
    const currentYear = new Date().getFullYear();
    const studentCode = `EXC-${currentYear}-${String(studentCount + 1).padStart(3, "0")}`;

    const email = v.email?.trim()
      ? v.email.trim().toLowerCase()
      : `${studentCode.toLowerCase().replace(/-/g, ".")}@exceed.local`;

    const classRecord = await prisma.class.findFirst({
      where: { id: v.classId, campusId: adminCampusId ?? undefined },
      include: {
        _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
      },
    });
    if (!classRecord) return err("Selected class not found.");
    if (classRecord._count.enrollments >= classRecord.capacity) {
      return err("This class is full. Please select a different class.");
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return err("A user with this email is already registered.");
    }

    const campusId = classRecord.campusId;
    const startDate = v.startDate ? new Date(v.startDate) : new Date();

    await prisma.$transaction(async (tx: StudentCreationTransaction) => {
      const newUser = await tx.user.create({
        data: {
          clerkId: `pending_${Date.now()}`,
          role: "STUDENT",
          firstName: v.firstName,
          lastName: v.lastName,
          email,
          phone: v.phone,
          gender: v.gender,
          dateOfBirth: v.dateOfBirth ? new Date(v.dateOfBirth) : undefined,
          address: v.address,
          campusId,
          studentProfile: {
            create: {
              studentCode,
              guardianName: v.guardianName,
              guardianPhone: v.guardianPhone,
              emergencyContact: v.emergencyContact,
              notes: v.notes,
              enrollments: {
                create: {
                  courseId: classRecord.courseId,
                  classId: v.classId,
                  startDate,
                  status: "ACTIVE",
                },
              },
            },
          },
        },
        include: {
          studentProfile: {
            include: {
              enrollments: { orderBy: { createdAt: "desc" }, take: 1 },
            },
          },
        },
      });

      const enrollmentId = newUser.studentProfile?.enrollments[0]?.id;
      if (!enrollmentId) throw new Error("Failed to create enrollment");

      await tx.payment.create({
        data: {
          userId: newUser.id,
          enrollmentId,
          amount: v.paymentAmount,
          method: v.paymentMethod,
          status: v.paymentStatus,
          paidAt: v.paymentStatus === "PAID" ? new Date() : undefined,
        },
      });

      return newUser;
    });

    const isRealEmail = v.email?.trim() && !v.email.includes("@exceed.local");

    if (isRealEmail) {
      try {
        const clerk = await clerkClient();
        await clerk.invitations.createInvitation({
          emailAddress: email,
          publicMetadata: { role: "STUDENT", campusId },
          redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/student`,
          ignoreExisting: true,
        });
      } catch (clerkError) {
        console.error("Clerk invitation failed:", clerkError);
      }
    }

    revalidatePath("/admin/students");
    revalidatePath("/admin/courses");
    return { success: true as const, studentCode };
  } catch (e) {
    if (e instanceof Error) {
      if (e.message.includes("email") || e.message.includes("unique")) {
        return err("A user with this email already exists.");
      }
      return err(e.message);
    }
    return err("Failed to register student. Please try again.");
  }
}

export async function updateStudent(id: string, formData: FormData) {
  try {
    const raw = actionInputToObject(formData);
    const v = updateStudentSchema.parse({
      ...raw,
      dateOfBirth: emptyToUndefined(raw.dateOfBirth),
    });

    await prisma.user.update({
      where: { id },
      data: {
        firstName: v.firstName,
        lastName: v.lastName,
        email: v.email,
        phone: v.phone,
        gender: v.gender,
        dateOfBirth: v.dateOfBirth ? new Date(v.dateOfBirth) : undefined,
        address: v.address,
        studentProfile: {
          update: {
            guardianName: v.guardianName,
            guardianPhone: v.guardianPhone,
            emergencyContact: v.emergencyContact,
            notes: v.notes,
          },
        },
      },
    });
    revalidatePath(`/admin/students/${id}`);
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed");
  }
}

export async function deleteStudent(id: string) {
  try {
    await prisma.enrollment.updateMany({
      where: { student: { userId: id } },
      data: { status: "DROPPED" },
    });
    revalidatePath("/admin/students");
    return ok;
  } catch (_e) {
    return err("Failed");
  }
}

export async function deleteTeacher(id: string) {
  try {
    const campusId = await getCurrentAdminCampusId();
    const teacher = await prisma.user.findFirst({
      where: {
        id,
        role: "TEACHER",
        ...(campusId ? { campusId } : {}),
      },
      include: {
        teacherProfile: {
          include: {
            classes: true,
          },
        },
      },
    });

    if (!teacher || !teacher.teacherProfile) {
      return err("Teacher not found.");
    }

    if (teacher.teacherProfile.classes.length > 0) {
      return err("Please reassign or remove this teacher from all classes before deleting.");
    }

    await prisma.user.delete({ where: { id } });
    revalidatePath("/admin/teachers");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to delete teacher");
  }
}

export async function deleteClass(id: string) {
  try {
    const campusId = await getCurrentAdminCampusId();
    const classRecord = await prisma.class.findFirst({
      where: { id, ...(campusId ? { campusId } : {}) },
      include: { enrollments: true, attendance: true },
    });

    if (!classRecord) {
      return err("Class not found.");
    }

    if (classRecord.enrollments.length > 0 || classRecord.attendance.length > 0) {
      return err("Cannot delete a class with enrollment or attendance history.");
    }

    await prisma.class.delete({ where: { id } });
    revalidatePath("/admin/classes");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to delete class");
  }
}

export async function changeStudentClass(
  enrollmentId: string,
  newClassId: string,
) {
  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        class: true,
        attendance: true,
        payments: true,
      },
    });

    if (!enrollment) return err("Enrollment not found.");
    if (enrollment.classId === newClassId) {
      return err("Student is already in this class.");
    }

    const newClass = await prisma.class.findUnique({
      where: { id: newClassId },
      include: {
        _count: {
          select: { enrollments: { where: { status: "ACTIVE" } } },
        },
      },
    });

    if (!newClass) return err("Selected class not found.");
    if (newClass._count.enrollments >= newClass.capacity) {
      return err("This class is full. Please select a different class.");
    }

    await prisma.$transaction(async (tx: ClassTransferTransaction) => {
      await tx.enrollment.update({
        where: { id: enrollmentId },
        data: { classId: newClassId, courseId: newClass.courseId },
      });

      if (enrollment.attendance.length > 0) {
        await tx.attendance.updateMany({
          where: { enrollmentId },
          data: { classId: newClassId },
        });
      }
    });

    revalidatePath("/admin/students");
    revalidatePath(`/admin/classes/${enrollment.classId}`);
    revalidatePath(`/admin/classes/${newClassId}`);
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to change class");
  }
}

export async function getReportPreview(type: "daily" | "weekly" | "monthly") {
  try {
    const user = await getCurrentUser();
    if (!user) return err("Not authenticated");

    const campusId = user.role === "SUPER_ADMIN" ? null : user.campusId;
    const report = await generateReport(type, campusId);

    return {
      success: true as const,
      summary: report.summary,
      periodLabel: report.periodLabel,
      filename: report.filename,
    };
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to generate preview");
  }
}

export async function createCourse(input: ActionInput) {
  try {
    const raw = actionInputToObject(input);
    const v = courseSchema.parse({
      title: raw.title,
      fee: Number(raw.fee),
      isActive: parseBoolean(raw.isActive, true),
    });

    const campusId = await getCurrentAdminCampusId();
    if (!campusId) return err("Could not determine your campus.");

    const createCourseWithSlug = () =>
      prisma.course.create({
        data: {
          title: v.title,
          fee: v.fee,
          isActive: v.isActive,
          slug: generateSlug(v.title),
          durationWeeks: 8,
          classType: "GROUP",
          description: null,
          campusId,
        },
      });

    try {
      await createCourseWithSlug();
    } catch (e) {
      if (!isUniqueConstraintError(e)) {
        throw e;
      }

      await createCourseWithSlug();
    }

    revalidatePath("/admin/courses");
    revalidatePath("/admin/students/new");
    return ok;
  } catch (e) {
    if (isUniqueConstraintError(e)) {
      return err(
        "A course with this name already exists. Please use a different name.",
      );
    }

    return err(e instanceof Error ? e.message : "Failed");
  }
}

export async function updateCourse(id: string, formData: FormData) {
  try {
    const raw = actionInputToObject(formData);
    const v = courseSchema.partial().parse({
      title: raw.title,
      fee: raw.fee === undefined ? undefined : Number(raw.fee),
      isActive: parseBoolean(raw.isActive),
    });
    await prisma.course.update({
      where: { id },
      data: {
        ...v,
        slug: v.title ? slugify(v.title) : undefined,
      },
    });
    revalidatePath(`/admin/courses/${id}`);
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed");
  }
}

export async function createTeacher(formData: FormData) {
  try {
    const raw = actionInputToObject(formData);
    const normalized = {
      ...raw,
      gender: emptyToUndefined(raw.gender),
      phone: emptyToUndefined(raw.phone),
      specialty: emptyToUndefined(raw.specialty),
      bio: emptyToUndefined(raw.bio),
    };
    const v = teacherSchema.parse(normalized);

    const email = v.email.trim().toLowerCase();
    const campusId = await getCurrentAdminCampusId();
    if (!campusId) {
      return err(
        "Could not determine your campus. Please contact super admin.",
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return err("A user with this email is already registered.");
    }

    const c = await prisma.teacherProfile.count();
    await prisma.user.create({
      data: {
        clerkId: `pending_${Date.now()}`,
        role: "TEACHER",
        firstName: v.firstName,
        lastName: v.lastName,
        email,
        phone: v.phone,
        gender: v.gender,
        campusId,
        teacherProfile: {
          create: {
            teacherCode: `TCH-${String(c + 1).padStart(3, "0")}`,
            specialty: v.specialty,
            bio: v.bio,
          },
        },
      },
    });

    try {
      const clerk = await clerkClient();
      await clerk.invitations.createInvitation({
        emailAddress: email,
        publicMetadata: { role: "TEACHER", campusId },
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/teacher`,
        ignoreExisting: true,
      });
    } catch (clerkError) {
      console.error("Clerk invitation failed:", clerkError);
    }

    revalidatePath("/admin/teachers");
    return ok;
  } catch (e) {
    if (e instanceof Error) {
      if (e.message.includes("email") || e.message.includes("unique")) {
        return err("A user with this email already exists.");
      }
      return err(e.message);
    }
    return err("Failed to add teacher. Please try again.");
  }
}

export async function updateTeacher(id: string, formData: FormData) {
  try {
    const normalized = actionInputToObject(formData);
    const v = updateTeacherSchema.parse({
      ...normalized,
      gender: emptyToUndefined(normalized.gender),
      phone: emptyToUndefined(normalized.phone),
      specialty: emptyToUndefined(normalized.specialty),
      bio: emptyToUndefined(normalized.bio),
    });

    await prisma.user.update({
      where: { id },
      data: {
        firstName: v.firstName,
        lastName: v.lastName,
        email: v.email,
        phone: v.phone,
        gender: v.gender,
        teacherProfile: {
          update: {
            specialty: v.specialty,
            bio: v.bio,
          },
        },
      },
    });

    revalidatePath(`/admin/teachers/${id}`);
    revalidatePath("/admin/teachers");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to update teacher");
  }
}

export async function updateClass(id: string, formData: FormData) {
  try {
    const raw = actionInputToObject(formData);
    const v = updateClassSchema.parse({
      courseId: raw.courseId as string,
      teacherId: raw.teacherId as string,
      labId: raw.labId as string,
      timeSlot: raw.timeSlot as string,
      days: raw.days as string,
      capacity: Number(raw.capacity),
    });

    const campusId = await getCurrentAdminCampusId();
    if (!campusId) return err("Could not determine your campus.");

    const classRecord = await prisma.class.findFirst({
      where: { id, campusId },
      include: { enrollments: { where: { status: "ACTIVE" } } },
    });
    if (!classRecord) return err("Class not found.");

    if (v.capacity < classRecord.enrollments.length) {
      return err(
        `Capacity cannot be less than current enrolled students (${classRecord.enrollments.length}).`,
      );
    }

    const existingConflict = await prisma.class.findFirst({
      where: {
        labId: v.labId,
        timeSlot: v.timeSlot,
        days: v.days,
        id: { not: id },
      },
    });
    if (existingConflict) {
      return err("This lab is already booked for the selected time and days.");
    }

    await prisma.class.update({
      where: { id },
      data: {
        courseId: v.courseId,
        teacherId: v.teacherId,
        labId: v.labId,
        timeSlot: v.timeSlot,
        days: v.days,
        capacity: v.capacity,
      },
    });

    revalidatePath(`/admin/classes/${id}`);
    revalidatePath("/admin/classes");
    revalidatePath("/admin/students/new");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to update class");
  }
}

export async function syncClerkUsers() {
  // This action finds Clerk users that don't have a matching DB user
  // and can be called manually to diagnose sync issues
  // For now just return a helpful message
  return {
    success: true,
    message:
      "Use Clerk Dashboard to manually delete orphan users at dashboard.clerk.com",
  };
}

export async function createClass(formData: FormData) {
  try {
    const campusId = await getCurrentAdminCampusId();
    if (!campusId) return err("Could not determine your campus.");

    const courseId = formData.get("courseId") as string;
    const teacherId = formData.get("teacherId") as string;
    const labId = formData.get("labId") as string;
    const timeSlot = formData.get("timeSlot") as string;
    const days = formData.get("days") as string;
    const capacity = Number(formData.get("capacity") ?? 20);

    if (!courseId || !teacherId || !labId || !timeSlot || !days) {
      return err("All fields are required.");
    }

    if (!(timeSlot in TIME_SLOTS) || !(days in CLASS_DAYS)) {
      return err("Please select a valid time slot and days.");
    }

    const selectedTimeSlot = timeSlot as keyof typeof TIME_SLOTS;
    const selectedDays = days as keyof typeof CLASS_DAYS;

    const [course, teacher, lab] = await Promise.all([
      prisma.course.findFirst({ where: { id: courseId, campusId } }),
      prisma.teacherProfile.findFirst({
        where: { id: teacherId, user: { campusId } },
      }),
      prisma.lab.findFirst({ where: { id: labId, campusId, isActive: true } }),
    ]);
    if (!course) return err("Selected course not found.");
    if (!teacher) return err("Selected teacher not found.");
    if (!lab) return err("Selected lab not found.");

    const existing = await prisma.class.findFirst({
      where: {
        labId,
        timeSlot: selectedTimeSlot,
        days: selectedDays,
      },
    });
    if (existing) {
      return err(`${lab.name} is already booked for this time slot and days.`);
    }

    await prisma.class.create({
      data: {
        campusId,
        courseId,
        teacherId,
        labId,
        timeSlot: selectedTimeSlot,
        days: selectedDays,
        capacity,
        isActive: true,
      },
    });

    revalidatePath("/admin/classes");
    revalidatePath("/admin/students/new");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to create class");
  }
}

export async function createSchedule(_formData: FormData) {
  return err("Schedules have been replaced by classes.");
}
export async function replyToReport(reportId: string, content: string) {
  try {
    if (!content) return err("Content required");
    await prisma.report.update({
      where: { id: reportId },
      data: { replyContent: content, repliedAt: new Date(), status: "REPLIED" },
    });
    revalidatePath(`/admin/reports/${reportId}`);
    return ok;
  } catch (_e) {
    return err("Failed");
  }
}

export async function markReportRead(reportId: string) {
  try {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (report?.status === "UNREAD") {
      await prisma.report.update({
        where: { id: reportId },
        data: { status: "READ" },
      });
    }
    revalidatePath("/admin/reports");
    return { success: true as const };
  } catch (_e) {
    return { success: false as const, error: "Failed" };
  }
}

export async function dropEnrollment(enrollmentId: string) {
  try {
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: "DROPPED", endDate: new Date() },
    });
    revalidatePath("/admin/students");
    return ok;
  } catch (_e) {
    return err("Failed");
  }
}

export async function dropEnrollmentFormAction(enrollmentId: string) {
  await dropEnrollment(enrollmentId);
}

export async function toggleCourseStatus(courseId: string, isActive: boolean) {
  try {
    await prisma.course.update({ where: { id: courseId }, data: { isActive } });
    revalidatePath("/admin/courses");
    return ok;
  } catch (_e) {
    return err("Failed");
  }
}

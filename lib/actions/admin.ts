"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import type { PaymentMethod, PaymentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentUser as getCampusCurrentUser } from "@/lib/campus";
import { getCurrentUser } from "@/lib/auth/current-user";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { generateReport } from "@/lib/reports";
import {
  courseSchema,
  studentSchema,
  teacherSchema,
  updateClassSchema,
  updateStudentSchema,
  updateTeacherSchema,
} from "@/lib/validations/admin";

const ok = { success: true as const };
const err = (error: string) => ({ success: false as const, error });

type ActionInput =
  | FormData
  | Record<string, FormDataEntryValue | number | boolean | undefined>;

type StudentRegistrationTransaction = {
  user: {
    create: (args: unknown) => Promise<{
      id: string;
      studentProfile: { id: string; enrollments: Array<{ id: string }> } | null;
    }>;
  };
  payment: { create: (args: unknown) => Promise<unknown> };
  studentProfile: { update: (args: unknown) => Promise<unknown> };
  class: {
    findUnique: (args: unknown) => Promise<{
      course: { durationWeeks: number };
    } | null>;
  };
  paymentRemaining: { create: (args: unknown) => Promise<unknown> };
};

type RemainingPaymentTransaction = {
  partialPayment: { create: (args: unknown) => Promise<unknown> };
  paymentRemaining: { update: (args: unknown) => Promise<unknown> };
  payment: { create: (args: unknown) => Promise<unknown> };
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

async function getCurrentAdminUserId(): Promise<string | null> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return null;
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    return user?.id ?? null;
  } catch {
    return null;
  }
}

async function requireAdminAction() {
  const user = await getCurrentUser();
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) return null;
  return user.clerkId;
}

async function getCurrentAdminCampusId(): Promise<{
  campusId: string | null;
  authenticated: boolean;
}> {
  const user = await getCurrentUser();
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return { campusId: null, authenticated: false };
  }

  if (user.role === "SUPER_ADMIN") {
    return { campusId: null, authenticated: true };
  }

  return { campusId: user.campusId, authenticated: true };
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function createStudent(
  input: ActionInput,
  enrollmentsData?: Array<{
    id: string;
    classType: "GROUP" | "PERSONAL" | "ONLINE";
    selectedClassId: string;
    startDate: string;
    endDate: string;
    courseFee: number;
    paymentAmount: string;
    remaining: number;
    paymentStatus: "PAID" | "PARTIAL" | "PENDING";
    paymentMethod?: string;
    receiptNumber?: string;
  }>,
) {
  try {
    const raw = actionInputToObject(input);
    const receiptNumber = String(raw.receiptNumber ?? "").trim() || null;

    // Use the first enrollment for basic validation if enrollmentsData is provided
    const enrollments = enrollmentsData || [
      {
        id: "enrollment-0",
        classType: "GROUP" as const,
        selectedClassId: raw.classId as string,
        startDate: raw.startDate as string,
        endDate: raw.endDate as string,
        courseFee: Number(raw.courseFee ?? 0),
        paymentAmount: String(raw.paymentAmount ?? 0),
        remaining: Number(raw.remainingAmount ?? 0),
        paymentStatus:
          (raw.paymentStatus as "PAID" | "PARTIAL" | "PENDING") ?? "PENDING",
        paymentMethod: emptyToUndefined(raw.paymentMethod as string),
        receiptNumber,
      },
    ];

    if (enrollments.length === 0) {
      return err("At least one enrollment is required.");
    }

    const selectedClassIds = enrollments
      .map((enr) => enr.selectedClassId)
      .filter(Boolean);
    if (selectedClassIds.length !== new Set(selectedClassIds).size) {
      return err(
        "Each enrollment must use a different class section. Remove duplicate class selections and try again.",
      );
    }

    const v = studentSchema.parse({
      firstName: raw.firstName,
      lastName: raw.lastName,
      phone: raw.phone,
      email: raw.email ?? "",
      gender: emptyToUndefined(raw.gender),
      dateOfBirth: emptyToUndefined(raw.dateOfBirth),
      telegram: emptyToUndefined(raw.telegram as string),
      whatsapp: emptyToUndefined(raw.whatsapp as string),
      registrationDate: emptyToUndefined(raw.registrationDate as string),
      guardianName: emptyToUndefined(raw.guardianName as string),
      guardianPhone: emptyToUndefined(raw.guardianPhone as string),
      emergencyContact: emptyToUndefined(raw.emergencyContact as string),
      notes: emptyToUndefined(raw.notes as string),
      classId: enrollments[0].selectedClassId,
      startDate: enrollments[0].startDate,
      endDate: enrollments[0].endDate,
      paymentStatus: enrollments[0].paymentStatus,
      paymentAmount: Number(enrollments[0].paymentAmount),
      remainingAmount: enrollments[0].remaining,
      paymentMethod: enrollments[0].paymentMethod,
    });

    const currentUser = await getCampusCurrentUser();
    if (!currentUser || !["ADMIN", "SUPER_ADMIN"].includes(currentUser.role)) {
      return err("Not authorized.");
    }
    const adminCampusId =
      currentUser.role === "SUPER_ADMIN" ? null : currentUser.campusId;

    // Generate unique student code based on highest existing code for current year
    const currentYear = new Date().getFullYear();
    const yearPrefix = `EXC-${currentYear}-`;
    const existingCodes = await prisma.studentProfile.findMany({
      where: {
        studentCode: {
          startsWith: yearPrefix,
        },
      },
      select: { studentCode: true },
      orderBy: { studentCode: "desc" },
      take: 1,
    });

    let nextNumber = 1;
    if (existingCodes.length > 0) {
      const lastCode = existingCodes[0].studentCode;
      const numberPart = parseInt(lastCode.split("-").pop() || "0", 10);
      nextNumber = numberPart + 1;
    }
    const studentCode = `${yearPrefix}${String(nextNumber).padStart(3, "0")}`;

    const email = v.email?.trim()
      ? v.email.trim().toLowerCase()
      : `${studentCode.toLowerCase().replace(/-/g, ".")}@exceed.local`;

    // Validate all selected classes
    const classRecords = await Promise.all(
      enrollments.map((enr) =>
        prisma.class.findFirst({
          where: {
            id: enr.selectedClassId,
            campusId: adminCampusId ?? undefined,
          },
          include: {
            course: true,
            _count: {
              select: { enrollments: { where: { status: "ACTIVE" } } },
            },
          },
        }),
      ),
    );

    for (let i = 0; i < classRecords.length; i++) {
      const classRecord = classRecords[i];
      if (!classRecord) {
        return err(`Selected class ${i + 1} not found.`);
      }
      if (classRecord._count.enrollments >= classRecord.capacity) {
        return err(
          `Class ${i + 1} (${classRecord.course.title}) is full. Please select a different class.`,
        );
      }
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return err("A user with this email is already registered.");
    }

    const campusId = classRecords[0]!.campusId;
    const registrationDate = v.registrationDate
      ? new Date(v.registrationDate)
      : new Date();
    const startDate = v.startDate
      ? new Date(v.startDate)
      : (classRecords[0]!.startDate ?? new Date());
    const endDate = v.endDate
      ? new Date(v.endDate)
      : (classRecords[0]!.endDate ?? undefined);

    await prisma.$transaction(async (tx) => {
      // Prepare enrollments data
      const enrollmentsToCreate = enrollments.map((enr, index) => {
        const classRecord = classRecords[index]!;
        const enrollmentStartDate = enr.startDate
          ? new Date(enr.startDate)
          : (classRecord.startDate ?? new Date());
        const enrollmentEndDate = enr.endDate
          ? new Date(enr.endDate)
          : (classRecord.endDate ?? undefined);

        return {
          courseId: classRecord.courseId,
          classId: enr.selectedClassId,
          startDate: enrollmentStartDate,
          endDate: enrollmentEndDate,
          status: "ACTIVE" as const,
        };
      });

      const newUser = await tx.user.create({
        data: {
          clerkId: `pending_${Date.now()}`,
          role: "STUDENT",
          firstName: v.firstName,
          lastName: v.lastName,
          email,
          phone: v.phone,
          telegram: v.telegram?.trim() || v.phone || null,
          whatsapp: v.whatsapp?.trim() || v.phone || null,
          gender: v.gender,
          dateOfBirth: v.dateOfBirth ? new Date(v.dateOfBirth) : undefined,
          address: v.address,
          campusId,
          studentProfile: {
            create: {
              studentCode,
              registrationDate,
              guardianName: v.guardianName,
              guardianPhone: v.guardianPhone,
              emergencyContact: v.emergencyContact,
              notes: v.notes,
              receiptNumber,
              enrollments: {
                create: enrollmentsToCreate,
              },
            },
          },
        },
        include: {
          studentProfile: {
            include: {
              enrollments: { orderBy: { createdAt: "asc" } },
            },
          },
        },
      });

      const studentEnrollments = newUser.studentProfile?.enrollments || [];
      if (studentEnrollments.length !== enrollments.length) {
        throw new Error("Failed to create all enrollments");
      }

      // Create payments for each enrollment
      for (let i = 0; i < enrollments.length; i++) {
        const enrollment = enrollments[i]!;
        const enrollmentRecord = studentEnrollments[i]!;
        const paymentAmount = Number(enrollment.paymentAmount);

        const enrollmentReceiptNumber =
          String(raw[`receiptNumber-${enrollment.id}`] ?? "").trim() ||
          enrollment.receiptNumber?.trim() ||
          receiptNumber;

        await tx.payment.create({
          data: {
            userId: newUser.id,
            enrollmentId: enrollmentRecord.id,
            amount: paymentAmount,
            method: (enrollment.paymentMethod as PaymentMethod) || undefined,
            status: enrollment.paymentStatus as PaymentStatus,
            paidAt:
              enrollment.paymentStatus === "PAID" ? new Date() : undefined,
            receiptNumber: enrollmentReceiptNumber || null,
          },
        });

        // Create remaining payment record if applicable
        const remainingAmount = enrollment.remaining ?? 0;
        if (remainingAmount > 0) {
          const classRecord = classRecords[i]!;
          const halfwayDays = Math.floor(
            (classRecord.course.durationWeeks * 7) / 2,
          );
          const dueDate = new Date(registrationDate);
          dueDate.setDate(dueDate.getDate() + halfwayDays);

          await tx.paymentRemaining.create({
            data: {
              enrollmentId: enrollmentRecord.id,
              originalFee: classRecord.course.fee ?? 0,
              paidAmount: paymentAmount,
              remainingAmount,
              dueDate,
              status: "PENDING",
            },
          });
        }
      }

      if (newUser.studentProfile?.id) {
        await tx.studentProfile.update({
          where: { id: newUser.studentProfile.id },
          data: { receiptNumber },
        });
      }

      const hasAssessment =
        raw.assessment_hasComputer ||
        raw.assessment_platforms ||
        raw.assessment_canBrowser;
      if (hasAssessment && newUser.studentProfile?.id) {
        await (tx as any).studentAssessment.create({
          data: {
            studentId: newUser.studentProfile.id,
            hasBasicComputerKnowledge:
              raw.assessment_hasComputer === "YES"
                ? true
                : raw.assessment_hasComputer === "NO"
                  ? false
                  : null,
            courseUnderstanding: raw.assessment_courseUnderstanding
              ? String(raw.assessment_courseUnderstanding)
                  .split(",")
                  .filter(Boolean)
              : [],
            socialMediaPlatforms: raw.assessment_platforms
              ? String(raw.assessment_platforms).split(",").filter(Boolean)
              : [],
            canCreateSimplePost: String(raw.assessment_canPost || "") || null,
            canUseBrowser: String(raw.assessment_canBrowser || "") || null,
            hasActiveEmail:
              raw.assessment_hasEmail === "YES"
                ? true
                : raw.assessment_hasEmail === "NO"
                  ? false
                  : null,
            canLoginEmail:
              raw.assessment_canLogin === "YES"
                ? true
                : raw.assessment_canLogin === "NO"
                  ? false
                  : null,
            hasDevice:
              raw.assessment_hasDevice === "YES"
                ? true
                : raw.assessment_hasDevice === "NO"
                  ? false
                  : null,
            hasInternetConnection:
              raw.assessment_hasInternet === "YES"
                ? true
                : raw.assessment_hasInternet === "NO"
                  ? false
                  : null,
          },
        });
      }

      return newUser;
    });

    const isRealEmail = v.email?.trim() && !v.email.includes("@exceed.local");

    if (isRealEmail) {
      try {
        const clerk = await clerkClient();

        // Check if user already exists in Clerk
        const existingUsers = await clerk.users.getUserList({
          emailAddress: [email],
        });

        if (existingUsers.totalCount > 0) {
          // User already exists — set role directly
          const existingClerkUser = existingUsers.data[0];
          await clerk.users.updateUser(existingClerkUser.id, {
            publicMetadata: { role: "STUDENT" },
          });

          // Update DB with real clerkId
          await prisma.user.update({
            where: { email },
            data: { clerkId: existingClerkUser.id },
          });
        } else {
          // Send invitation with role metadata
          // The webhook will sync the role when the student accepts
          await clerk.invitations.createInvitation({
            emailAddress: email,
            publicMetadata: { role: "STUDENT" },
            redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/student`,
            ignoreExisting: false, // Set to false to ensure proper metadata transfer
          });
        }
      } catch (clerkError) {
        // Continue even if Clerk fails — webhook will handle it
      }
    }

    revalidatePath("/admin/students");
    revalidatePath("/admin/courses");
    return { success: true as const, studentCode };
  } catch (e) {
    if (e instanceof Error) {
      const message = e.message;
      if (message.toLowerCase().includes("unique constraint")) {
        return err(
          "This student is already enrolled in one of the selected class sections. Please select different class sections or remove duplicates.",
        );
      }
      if (
        message.includes("email") ||
        message.toLowerCase().includes("unique")
      ) {
        return err("A user with this email already exists.");
      }
      return err(message);
    }
    return err("Failed to register student. Please try again.");
  }
}

export async function updateStudent(id: string, formData: FormData) {
  try {
    const adminId = await requireAdminAction();
    if (!adminId) return err("Not authenticated");

    const raw = actionInputToObject(formData);
    const v = updateStudentSchema.parse({
      ...raw,
      dateOfBirth: emptyToUndefined(raw.dateOfBirth),
    });

    // Get current user to check if email is being changed
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { email: true, clerkId: true },
    });

    if (!currentUser) {
      return err("Student not found.");
    }

    // Normalize new email if provided
    const newEmail = v.email ? v.email.trim().toLowerCase() : null;
    const currentEmail = currentUser.email.toLowerCase();

    // If email is changing, check if new email already exists
    if (newEmail && newEmail !== currentEmail) {
      const existingUser = await prisma.user.findUnique({
        where: { email: newEmail },
        select: { id: true },
      });

      if (existingUser && existingUser.id !== id) {
        return err("This email is already used by another student.");
      }
    }

    await prisma.user.update({
      where: { id },
      data: {
        firstName: v.firstName,
        lastName: v.lastName,
        email: newEmail || currentEmail,
        phone: v.phone,
        telegram: v.telegram?.trim() || v.phone || null,
        whatsapp: v.whatsapp?.trim() || v.phone || null,
        gender: v.gender,
        dateOfBirth: v.dateOfBirth ? new Date(v.dateOfBirth) : undefined,
        address: v.address,
        studentProfile: {
          update: {
            registrationDate: v.registrationDate
              ? new Date(v.registrationDate)
              : undefined,
            guardianName: v.guardianName,
            guardianPhone: v.guardianPhone,
            emergencyContact: v.emergencyContact,
            notes: v.notes,
          },
        },
      },
    });

    // If email changed and student has accepted invitation (has real clerkId), send new invitation to new email
    if (
      newEmail &&
      newEmail !== currentEmail &&
      currentUser.clerkId &&
      !currentUser.clerkId.startsWith("pending_")
    ) {
      try {
        const clerk = await clerkClient();

        // Send invitation to new email
        await clerk.invitations.createInvitation({
          emailAddress: newEmail,
          publicMetadata: { role: "STUDENT" },
          redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/student`,
          ignoreExisting: false,
        });
      } catch (clerkError) {
        // Log but don't fail the update — email is already updated in database
      }
    }

    revalidatePath(`/admin/students/${id}`);
    return ok;
  } catch (e) {
    if (isUniqueConstraintError(e)) {
      return err("This email is already in use by another student.");
    }
    return err(e instanceof Error ? e.message : "Failed to update student");
  }
}

export async function deleteStudent(userId: string) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return err("Not authenticated");

    const student = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: {
          include: {
            enrollments: {
              include: {
                payments: true,
                attendance: true,
                paymentRemaining: true,
                feedback: true,
              },
            },
            certificates: true,
            cocEntries: true,
          },
        },
      },
    });

    if (!student) return err("Student not found");

    if (!student.clerkId.startsWith("pending_")) {
      try {
        const clerk = await clerkClient();
        await clerk.users.deleteUser(student.clerkId);
      } catch (clerkErr) {
        // If Clerk delete fails, continue anyway — the user can't sign in anyway
      }
    }

    const profileId = student.studentProfile?.id;

    await prisma.$transaction(async (tx) => {
      if (profileId) {
        await tx.attendance.deleteMany({
          where: { enrollment: { studentId: profileId } },
        });

        await tx.partialPayment.deleteMany({
          where: { paymentRemaining: { enrollment: { studentId: profileId } } },
        });

        await tx.paymentRemaining.deleteMany({
          where: { enrollment: { studentId: profileId } },
        });

        await tx.payment.deleteMany({
          where: { enrollment: { studentId: profileId } },
        });

        await tx.studentFeedback.deleteMany({
          where: { studentId: student.id },
        });

        await tx.studentNotification.deleteMany({
          where: { studentId: student.id },
        });

        await tx.withdrawal.deleteMany({
          where: { enrollment: { studentId: profileId } },
        });

        await tx.enrollment.deleteMany({
          where: { studentId: profileId },
        });

        await tx.certificate.deleteMany({
          where: { studentId: profileId },
        });

        await tx.cOCStudent.deleteMany({
          where: { studentProfileId: profileId },
        });

        await tx.studentAssessment.deleteMany({
          where: { studentId: profileId },
        });

        await tx.studentProfile.delete({
          where: { id: profileId },
        });
      }

      await tx.payment.deleteMany({ where: { userId: student.id } });
      await tx.user.delete({ where: { id: userId } });
    });

    revalidatePath("/admin/students");
    revalidatePath("/super-admin/students");
    return ok;
  } catch (e) {
    console.error("Delete student error:", e);
    return err(e instanceof Error ? e.message : "Failed to delete student");
  }
}

export async function deleteTeacher(userId: string) {
  try {
    const { campusId, authenticated } = await getCurrentAdminCampusId();
    if (!authenticated) return err("Not authenticated");

    const teacher = await prisma.user.findFirst({
      where: { id: userId, role: "TEACHER", ...(campusId ? { campusId } : {}) },
      include: {
        teacherProfile: { include: { classes: { select: { id: true } } } },
      },
    });
    if (!teacher) return err("Teacher not found");

    if (teacher.teacherProfile?.classes.length) {
      return err(
        "Please reassign or remove this teacher from all classes before deleting.",
      );
    }

    if (!teacher.clerkId.startsWith("pending_")) {
      try {
        const clerk = await clerkClient();
        await clerk.users.deleteUser(teacher.clerkId);
      } catch {
        // Continue with local deletion if Clerk cleanup fails.
      }
    }

    if (teacher.teacherProfile) {
      await prisma.material.deleteMany({ where: { uploadedById: teacher.id } });
      await prisma.teacherProfile.delete({
        where: { id: teacher.teacherProfile.id },
      });
    }

    await prisma.user.delete({ where: { id: userId } });
    revalidatePath("/admin/teachers");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to delete teacher");
  }
}

export async function deleteClass(id: string) {
  try {
    const { campusId, authenticated } = await getCurrentAdminCampusId();
    if (!authenticated) return err("Not authenticated");

    const classRecord = await prisma.class.findFirst({
      where: { id, ...(campusId ? { campusId } : {}) },
    });

    if (!classRecord) {
      return err("Class not found.");
    }

    await prisma.$transaction([
      prisma.attendance.updateMany({
        where: { classId: id },
        data: { classId: null },
      }),
      prisma.enrollment.updateMany({
        where: { classId: id },
        data: { classId: null },
      }),
      prisma.class.delete({ where: { id } }),
    ]);

    revalidatePath("/admin/classes");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to delete class");
  }
}

export async function changeStudentClass(
  enrollmentIdOrFormData: string | FormData,
  maybeNewClassId?: string,
) {
  try {
    const enrollmentId =
      enrollmentIdOrFormData instanceof FormData
        ? (enrollmentIdOrFormData.get("enrollmentId") as string)
        : enrollmentIdOrFormData;
    const newClassId =
      enrollmentIdOrFormData instanceof FormData
        ? (enrollmentIdOrFormData.get("newClassId") as string)
        : maybeNewClassId;

    if (!enrollmentId || !newClassId) return err("Missing fields");

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

    await prisma.$transaction(async (tx) => {
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
    const user = await getCampusCurrentUser();
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
      durationWeeks: Number(raw.durationWeeks ?? 8),
      isActive: parseBoolean(raw.isActive, true),
    });

    const currentUser = await getCampusCurrentUser();
    const adminCampus = await getCurrentAdminCampusId();
    const campusId =
      currentUser?.role === "SUPER_ADMIN"
        ? typeof raw.campusId === "string" && raw.campusId.trim()
          ? raw.campusId.trim()
          : null
        : adminCampus.authenticated
          ? adminCampus.campusId
          : null;
    if (!adminCampus.authenticated && currentUser?.role !== "SUPER_ADMIN") {
      return err("Not authenticated");
    }
    if (!campusId) return err("Could not determine your campus.");

    const createCourseWithSlug = () =>
      prisma.course.create({
        data: {
          title: v.title,
          fee: v.fee,
          isActive: v.isActive,
          slug: generateSlug(v.title),
          durationWeeks: v.durationWeeks,
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
    revalidatePath("/super-admin/courses");
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
    const adminId = await requireAdminAction();
    if (!adminId) return err("Not authenticated");

    const raw = actionInputToObject(formData);
    const v = courseSchema.partial().parse({
      title: raw.title,
      fee: raw.fee === undefined ? undefined : Number(raw.fee),
      durationWeeks:
        raw.durationWeeks === undefined ? undefined : Number(raw.durationWeeks),
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
    revalidatePath("/super-admin/courses");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed");
  }
}

export async function createTeacher(formData: FormData) {
  try {
    const adminId = await requireAdminAction();
    if (!adminId) return err("Not authenticated");

    const raw = actionInputToObject(formData);
    const specialtiesRaw = raw.specialties as string | undefined;
    const specialties = specialtiesRaw
      ? specialtiesRaw.split("||").filter(Boolean)
      : [];
    const normalized = {
      ...raw,
      gender: emptyToUndefined(raw.gender),
      phone: emptyToUndefined(raw.phone),
      specialty: specialties[0] ?? emptyToUndefined(raw.specialty),
      specialties: specialtiesRaw,
      bio: emptyToUndefined(raw.bio),
    };
    const v = teacherSchema.parse(normalized);

    const email = v.email.trim().toLowerCase();
    const { campusId, authenticated } = await getCurrentAdminCampusId();
    if (!authenticated) return err("Not authenticated");
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
            specialties,
            specialty: specialties[0] || v.specialty || null,
            bio: v.bio,
          },
        },
      },
    });

    try {
      const clerk = await clerkClient();

      const existingUsers = await clerk.users.getUserList({
        emailAddress: [email],
      });

      if (existingUsers.totalCount > 0) {
        const existingClerkUser = existingUsers.data[0];
        await clerk.users.updateUser(existingClerkUser.id, {
          publicMetadata: { role: "TEACHER" },
        });
        await prisma.user.update({
          where: { email },
          data: { clerkId: existingClerkUser.id },
        });
      } else {
        await clerk.invitations.createInvitation({
          emailAddress: email,
          publicMetadata: { role: "TEACHER" },
          redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/teacher`,
          ignoreExisting: true,
        });
      }
    } catch (clerkError) {
      // Continue even if Clerk fails — webhook will handle role assignment
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
    const adminId = await requireAdminAction();
    if (!adminId) return err("Not authenticated");

    const raw = actionInputToObject(formData);
    const firstName = String(raw.firstName ?? "").trim();
    const lastName = String(raw.lastName ?? "").trim();
    if (!firstName || !lastName) return err("First and last name are required");

    const profileById = await prisma.teacherProfile.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
    const userId = profileById?.userId ?? id;
    const teacherProfileId = profileById?.id;

    const specialtiesRaw = raw.specialties as string | undefined;
    const specialties = specialtiesRaw
      ? specialtiesRaw.split("||").filter(Boolean)
      : [];

    await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        ...(typeof raw.email === "string" && raw.email.trim()
          ? { email: raw.email.trim() }
          : {}),
        phone:
          typeof raw.phone === "string" && raw.phone.trim()
            ? raw.phone.trim()
            : null,
        address:
          typeof raw.address === "string" && raw.address.trim()
            ? raw.address.trim()
            : null,
        telegram:
          typeof raw.telegram === "string" && raw.telegram.trim()
            ? raw.telegram.trim()
            : null,
        ...(typeof raw.gender === "string" && raw.gender.trim()
          ? { gender: raw.gender.trim() as any }
          : {}),
        profilePhoto:
          typeof raw.profilePhoto === "string" && raw.profilePhoto.trim()
            ? raw.profilePhoto.trim()
            : null,
        teacherProfile: {
          update: {
            ...(specialtiesRaw !== undefined
              ? { specialties, specialty: specialties[0] ?? null }
              : {}),
            bio:
              typeof raw.bio === "string" && raw.bio.trim()
                ? raw.bio.trim()
                : null,
          },
        },
      },
    });

    revalidatePath(`/admin/teachers/${teacherProfileId ?? id}`);
    revalidatePath("/admin/teachers");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to update teacher");
  }
}

export async function updateClass(id: string, formData: FormData) {
  try {
    const adminId = await requireAdminAction();
    if (!adminId) return err("Not authenticated");

    const raw = actionInputToObject(formData);
    const v = updateClassSchema.parse({
      courseId: raw.courseId as string,
      teacherId: raw.teacherId as string,
      labId: raw.labId as string,
      timeSlot: raw.timeSlot as string,
      days: raw.days as string,
      capacity: Number(raw.capacity),
      startDate: raw.startDate as string | undefined,
      endDate: raw.endDate as string | undefined,
      classType:
        (raw.classType as "GROUP" | "PERSONAL" | "ONLINE" | undefined) ??
        "GROUP",
      onlineLink: raw.onlineLink as string | undefined,
    });

    const { campusId, authenticated } = await getCurrentAdminCampusId();
    if (!authenticated) return err("Not authenticated");
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

    if (v.classType !== "ONLINE" && !v.labId)
      return err("Lab is required for non-online classes");
    const existingConflict =
      v.classType === "ONLINE"
        ? null
        : await prisma.class.findFirst({
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
        labId: v.classType === "ONLINE" ? null : v.labId,
        onlineLink:
          v.classType === "ONLINE" ? v.onlineLink?.trim() || null : null,
        timeSlot: v.timeSlot,
        days: v.days,
        capacity: v.capacity,
        startDate: v.startDate ? new Date(v.startDate) : null,
        endDate: v.endDate ? new Date(v.endDate) : null,
        classType: v.classType,
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
  try {
    const adminId = await requireAdminAction();
    if (!adminId) return err("Not authenticated");

    return {
      success: true as const,
      message:
        "Use Clerk Dashboard to manually delete orphan users at dashboard.clerk.com",
    };
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed");
  }
}

export async function createClass(formData: FormData) {
  try {
    const adminId = await requireAdminAction();
    if (!adminId) return err("Not authenticated");

    const { campusId, authenticated } = await getCurrentAdminCampusId();
    if (!authenticated) return err("Not authenticated");
    if (!campusId) return err("Could not determine your campus.");

    const courseId = formData.get("courseId") as string;
    const teacherId = formData.get("teacherId") as string;
    const labId = formData.get("labId") as string;
    const timeSlot = formData.get("timeSlot") as string;
    const days = formData.get("days") as string;
    const capacity = Number(formData.get("capacity") ?? 20);
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const classType = (formData.get("classType") as string) || "GROUP";

    if (!courseId || !teacherId || !timeSlot || !days) {
      return err("All fields are required.");
    }
    if (classType !== "ONLINE" && !labId) {
      return err("Lab is required for non-online classes");
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
      labId
        ? prisma.lab.findFirst({
            where: { id: labId, campusId, isActive: true },
          })
        : Promise.resolve(null),
    ]);
    if (!course) return err("Selected course not found.");
    if (!teacher) return err("Selected teacher not found.");
    if (classType !== "ONLINE" && !lab) return err("Selected lab not found.");

    const existing =
      classType === "ONLINE"
        ? null
        : await prisma.class.findFirst({
            where: {
              labId,
              timeSlot: selectedTimeSlot,
              days: selectedDays,
            },
          });
    if (existing) {
      return err(
        `${lab?.name ?? "This lab"} is already booked for this time slot and days.`,
      );
    }

    await prisma.class.create({
      data: {
        campusId,
        courseId,
        teacherId,
        labId: classType === "ONLINE" ? null : labId,
        onlineLink:
          classType === "ONLINE"
            ? (formData.get("onlineLink") as string)?.trim() || null
            : null,
        timeSlot: selectedTimeSlot,
        days: selectedDays,
        capacity,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        classType: classType as "GROUP" | "PERSONAL" | "ONLINE",
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

export async function recordPartialPayment(
  paymentRemainingId: string,
  amount: number,
  method: string,
  note: string,
) {
  try {
    const userId = await getCurrentAdminUserId();
    if (!userId) return err("Not authenticated");

    const remaining = await prisma.paymentRemaining.findUnique({
      where: { id: paymentRemainingId },
      include: { enrollment: { include: { student: true } } },
    });
    if (!remaining) return err("Payment record not found");
    if (amount <= 0) return err("Amount must be greater than zero");
    if (amount > remaining.remainingAmount) {
      return err("Amount exceeds remaining balance");
    }

    const newRemainingAmount = remaining.remainingAmount - amount;
    const newPaidAmount = remaining.paidAmount + amount;
    const newStatus = newRemainingAmount <= 0 ? "PAID" : "PARTIAL";

    await prisma.$transaction(async (tx) => {
      await tx.partialPayment.create({
        data: {
          paymentRemainingId,
          amount,
          method: method as "CASH" | "BANK_TRANSFER" | "MOBILE_MONEY" | "CARD",
          note: note?.trim() || null,
          recordedById: userId,
        },
      });

      await tx.paymentRemaining.update({
        where: { id: paymentRemainingId },
        data: {
          remainingAmount: newRemainingAmount,
          paidAmount: newPaidAmount,
          status: newStatus,
        },
      });
    });

    revalidatePath("/admin/remaining");
    revalidatePath("/admin/students");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to record payment");
  }
}

export async function createSchedule(_formData: FormData) {
  return err("Schedules have been replaced by classes.");
}
export async function replyToReport(reportId: string, content: string) {
  try {
    const adminId = await requireAdminAction();
    if (!adminId) return err("Not authenticated");

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
    const adminId = await requireAdminAction();
    if (!adminId) return err("Not authenticated");

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
    const adminId = await requireAdminAction();
    if (!adminId) return err("Not authenticated");

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
  try {
    await dropEnrollment(enrollmentId);
  } catch (e) {
    console.error("dropEnrollmentFormAction error:", e);
  }
}

export async function toggleCourseStatus(courseId: string, isActive: boolean) {
  try {
    const adminId = await requireAdminAction();
    if (!adminId) return err("Not authenticated");

    await prisma.course.update({ where: { id: courseId }, data: { isActive } });
    revalidatePath("/admin/courses");
    return ok;
  } catch (_e) {
    return err("Failed");
  }
}

export async function updateClassStatus(
  classId: string,
  status: "REGISTRATION" | "STARTED" | "ENDED",
) {
  try {
    const adminId = await requireAdminAction();
    if (!adminId) return err("Not authenticated");

    if (status === "ENDED") {
      await prisma.enrollment.updateMany({
        where: { classId, status: "ACTIVE" },
        data: { status: "COMPLETED", endDate: new Date() },
      });
    }
    await prisma.class.update({ where: { id: classId }, data: { status } });
    revalidatePath(`/admin/classes/${classId}`);
    revalidatePath("/admin/classes");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to update status");
  }
}

export async function withdrawStudent(
  enrollmentIdOrFormData: string | FormData,
  maybeReason?: string,
  expectedReturnDate?: string | null,
  notes?: string | null,
) {
  try {
    const adminId = await getCurrentAdminUserId();
    if (!adminId) return err("Not authenticated");

    const enrollmentId =
      enrollmentIdOrFormData instanceof FormData
        ? (enrollmentIdOrFormData.get("enrollmentId") as string)
        : enrollmentIdOrFormData;
    const reason =
      enrollmentIdOrFormData instanceof FormData
        ? (enrollmentIdOrFormData.get("reason") as string)
        : maybeReason;
    const formExpectedReturnDate =
      enrollmentIdOrFormData instanceof FormData
        ? (enrollmentIdOrFormData.get("expectedReturnDate") as string)
        : expectedReturnDate;
    const contactDuring =
      enrollmentIdOrFormData instanceof FormData
        ? (enrollmentIdOrFormData.get("contactDuring") as string)
        : null;
    const withdrawalNotes =
      enrollmentIdOrFormData instanceof FormData
        ? (enrollmentIdOrFormData.get("notes") as string)
        : notes;

    if (!enrollmentId) return err("Missing enrollment ID");
    if (!reason?.trim()) return err("Reason is required");

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { id: true, status: true },
    });
    if (!enrollment) return err("Enrollment not found");
    if (enrollment.status !== "ACTIVE") return err("Enrollment is not active");

    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: "ON_HOLD" },
    });
    await prisma.withdrawal.create({
      data: {
        enrollmentId,
        reason: reason.trim(),
        startDate: new Date(),
        expectedReturnDate: formExpectedReturnDate
          ? new Date(formExpectedReturnDate)
          : null,
        contactDuring: contactDuring?.trim() || null,
        withdrawalNotes: withdrawalNotes?.trim() || null,
        status: "ACTIVE",
        approvedById: adminId,
        notes: withdrawalNotes?.trim() || null,
      },
    });
    revalidatePath("/admin/students");
    revalidatePath("/admin/withdrawn");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to process withdrawal");
  }
}

export async function assignWithdrawnStudent(
  enrollmentId: string,
  newClassId: string,
) {
  try {
    const adminId = await requireAdminAction();
    if (!adminId) return err("Not authenticated");

    const newClass = await prisma.class.findUnique({
      where: { id: newClassId },
      include: {
        _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
      },
    });
    if (!newClass) return err("Class not found");
    if (newClass._count.enrollments >= newClass.capacity)
      return err("This class is full");
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        classId: newClassId,
        courseId: newClass.courseId,
        status: "ACTIVE",
      },
    });
    await prisma.withdrawal.updateMany({
      where: { enrollmentId, status: "ACTIVE" },
      data: { status: "RETURNED", actualReturnDate: new Date() },
    });
    revalidatePath("/admin/withdrawn");
    revalidatePath("/super-admin/withdrawn");
    revalidatePath("/admin/students");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to assign student");
  }
}

export async function dropStudent(enrollmentId: string, _reason: string) {
  try {
    const adminId = await requireAdminAction();
    if (!adminId) return err("Not authenticated");

    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: "DROPPED", endDate: new Date() },
    });
    revalidatePath("/admin/students");
    revalidatePath("/admin/dropped");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to drop student");
  }
}

export async function undropStudent(enrollmentId: string) {
  try {
    const adminId = await requireAdminAction();
    if (!adminId) return err("Not authenticated");

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });
    if (!enrollment) return err("Enrollment not found");
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: "ACTIVE", endDate: null },
    });
    revalidatePath("/admin/dropped");
    revalidatePath("/super-admin/dropped");
    revalidatePath("/admin/students");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to undo drop");
  }
}

export async function addToWaitlist(formData: FormData) {
  try {
    const adminId = await requireAdminAction();
    if (!adminId) return err("Not authenticated");

    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const phone = formData.get("phone") as string;
    const coursesRaw = formData.get("courses") as string;
    const notes = formData.get("notes") as string;
    if (!firstName || !lastName || !phone)
      return err("First name, last name, and phone are required");
    const courses = coursesRaw ? coursesRaw.split("||").filter(Boolean) : [];
    if (courses.length === 0) return err("At least one course is required");
    await prisma.teacherWaitlist.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        courses,
        notes: notes?.trim() || null,
      },
    });
    revalidatePath("/admin/waitlist");
    revalidatePath("/super-admin/waitlist");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to add to waitlist");
  }
}

export async function removeFromWaitlist(id: string) {
  try {
    const adminId = await requireAdminAction();
    if (!adminId) return err("Not authenticated");

    await prisma.teacherWaitlist.delete({ where: { id } });
    revalidatePath("/admin/waitlist");
    revalidatePath("/super-admin/waitlist");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to remove");
  }
}
export async function markWaitlistJoined(id: string) {
  try {
    const adminId = await requireAdminAction();
    if (!adminId) return err("Not authenticated");

    await prisma.teacherWaitlist.update({
      where: { id },
      data: { status: "JOINED" },
    });
    revalidatePath("/admin/waitlist");
    revalidatePath("/super-admin/waitlist");
    return ok;
  } catch {
    return err("Failed");
  }
}

export async function claimCertificate(formData: FormData) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return err("Not authenticated");

    const admin = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    if (!admin) return err("Not authenticated");

    const studentId = formData.get("studentId") as string;
    const courseId = formData.get("courseId") as string;
    const receiptNumber = formData.get("receiptNumber") as string;
    const fullNameAmharic = formData.get("fullNameAmharic") as string;
    const manualStudentName = formData.get("manualStudentName") as string;
    const paymentStatus =
      (formData.get("paymentStatus") as string) || "PENDING";
    const paymentMethod = (formData.get("paymentMethod") as string) || "CASH";
    const notes = formData.get("notes") as string;

    if (!receiptNumber?.trim()) return err("Receipt number is required");
    if (!studentId || !courseId) return err("Missing required fields");

    const existing = await prisma.certificate.findFirst({
      where: { studentId, courseId },
    });
    if (existing) {
      return err("Certificate already exists for this student and course");
    }

    await prisma.certificate.create({
      data: {
        studentId,
        courseId,
        receiptNumber: receiptNumber.trim(),
        fullNameAmharic: fullNameAmharic?.trim() || null,
        manualStudentName: manualStudentName?.trim() || null,
        claimedById: admin.id,
        paymentStatus: paymentStatus as PaymentStatus,
        paymentMethod: paymentMethod as PaymentMethod,
        notes: notes?.trim() || null,
        isDelivered: false,
      },
    });

    revalidatePath("/admin/certificates");
    revalidatePath("/super-admin/certificates");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to claim certificate");
  }
}

export async function createManualCertificate(formData: FormData) {
  try {
    const adminId = await requireAdminAction();
    if (!adminId) return err("Not authenticated");

    const dbAdminId = await getCurrentAdminUserId();
    if (!dbAdminId) return err("Not authenticated");

    const studentName = formData.get("studentName") as string;
    const fullNameAmharic = formData.get("fullNameAmharic") as string | null;
    const courseId = formData.get("courseId") as string;
    const paymentStatus = formData.get("paymentStatus") as string;
    const paymentMethod = formData.get("paymentMethod") as string;
    const notes = formData.get("notes") as string;
    if (!studentName?.trim() || !courseId)
      return err("Student name and course are required");
    await prisma.certificate.create({
      data: {
        manualStudentName: studentName.trim(),
        fullNameAmharic: fullNameAmharic?.trim() || null,
        courseId,
        paymentStatus: paymentStatus as PaymentStatus,
        paymentMethod:
          paymentStatus === "PAID" ? (paymentMethod as PaymentMethod) : null,
        claimedById: dbAdminId,
        notes: notes?.trim() || null,
        isDelivered: false,
        verifyCode: `CERT-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      },
    });
    revalidatePath("/admin/certificates");
    revalidatePath("/super-admin/certificates");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed");
  }
}
export async function markCertificateAsDone(certificateId: string) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return err("Not authenticated");

    const admin = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    if (!admin) return err("Not authenticated");

    const cert = await prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        student: { include: { user: { select: { id: true } } } },
        course: { select: { title: true } },
      },
    });
    if (!cert) return err("Certificate not found");

    await prisma.certificate.update({
      where: { id: certificateId },
      data: { isDone: true, doneAt: new Date() },
    });

    if (cert.student?.user?.id) {
      await prisma.studentNotification
        .create({
          data: {
            studentId: cert.student.user.id,
            title: "🎓 Your Certificate is Ready!",
            body: `Your ${cert.course.title} certificate is ready. Please visit the training center to collect it.`,
            type: "SUCCESS",
            createdById: admin.id,
          },
        })
        .catch(() => {});
    }

    revalidatePath("/admin/certificates");
    revalidatePath("/super-admin/certificates");
    revalidatePath("/student/certificate");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to mark as done");
  }
}

export async function unmarkCertificateAsDone(certificateId: string) {
  try {
    const adminId = await requireAdminAction();
    if (!adminId) return err("Not authenticated");

    await prisma.certificate.update({
      where: { id: certificateId },
      data: { isDone: false, doneAt: null },
    });
    revalidatePath("/admin/certificates");
    revalidatePath("/super-admin/certificates");
    revalidatePath("/student/certificate");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to unmark");
  }
}

export async function markCertificateDelivered(certificateId: string) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return err("Not authenticated");

    const admin = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    if (!admin) return err("Not authenticated");

    const cert = await prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        student: {
          include: {
            user: { select: { id: true } },
            enrollments: {
              include: {
                paymentRemaining: {
                  select: { remainingAmount: true, status: true },
                },
              },
            },
          },
        },
        course: { select: { title: true } },
      },
    });

    if (!cert) return err("Certificate not found");

    const hasUnpaidRemaining = cert.student?.enrollments.some(
      (enrollment) =>
        enrollment.paymentRemaining &&
        enrollment.paymentRemaining.status !== "PAID" &&
        enrollment.paymentRemaining.remainingAmount > 0,
    );

    if (hasUnpaidRemaining) {
      return err(
        "Cannot deliver certificate. Student has outstanding balance.",
      );
    }

    await prisma.certificate.update({
      where: { id: certificateId },
      data: {
        isDelivered: true,
        deliveredAt: new Date(),
      },
    });

    if (cert.student?.user?.id) {
      await prisma.studentNotification
        .create({
          data: {
            studentId: cert.student.user.id,
            title: "🎓 Your Certificate is Ready!",
            body: `Your ${cert.course.title} certificate has been delivered. Please visit the training center to collect it.`,
            type: "SUCCESS",
            createdById: admin.id,
          },
        })
        .catch(() => {});
    }

    revalidatePath("/admin/certificates");
    revalidatePath("/super-admin/certificates");
    revalidatePath("/student/certificate");
    return ok;
  } catch (e) {
    return err(
      e instanceof Error
        ? e.message
        : "Failed to mark certificate as delivered",
    );
  }
}

export async function updateCertificate(
  certificateId: string,
  formData: FormData,
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return err("Not authenticated");

    const manualStudentName = formData.get("manualStudentName") as string;
    const fullNameAmharic = formData.get("fullNameAmharic") as string;
    const receiptNumber = formData.get("receiptNumber") as string;
    const notes = formData.get("notes") as string;
    const paymentStatus = formData.get("paymentStatus") as string;

    await prisma.certificate.update({
      where: { id: certificateId },
      data: {
        manualStudentName: manualStudentName?.trim() || null,
        fullNameAmharic: fullNameAmharic?.trim() || null,
        receiptNumber: receiptNumber?.trim() || null,
        notes: notes?.trim() || null,
        paymentStatus: (paymentStatus as PaymentStatus) || "PENDING",
      },
    });

    revalidatePath("/admin/certificates");
    revalidatePath("/super-admin/certificates");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to update certificate");
  }
}

export async function updateCertificatePayment(
  certificateId: string,
  paymentStatus: string,
  paymentMethod: string,
) {
  try {
    const adminId = await requireAdminAction();
    if (!adminId) return err("Not authenticated");

    await prisma.certificate.update({
      where: { id: certificateId },
      data: {
        paymentStatus: paymentStatus as PaymentStatus,
        paymentMethod: paymentMethod as PaymentMethod,
      },
    });
    revalidatePath("/admin/certificates");
    revalidatePath("/super-admin/certificates");
    return ok;
  } catch {
    return err("Failed");
  }
}

export async function updateWaitlist(id: string, formData: FormData) {
  try {
    const adminId = await requireAdminAction();
    if (!adminId) return err("Not authenticated");

    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const phone = formData.get("phone") as string;
    const coursesRaw = formData.get("courses") as string;
    const notes = formData.get("notes") as string;
    const courses = coursesRaw ? coursesRaw.split("||").filter(Boolean) : [];
    if (!firstName || !lastName || !phone || courses.length === 0) {
      return err(
        "First name, last name, phone, and at least one course are required",
      );
    }
    await prisma.teacherWaitlist.update({
      where: { id },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        courses,
        notes: notes?.trim() || null,
      },
    });
    revalidatePath("/admin/waitlist");
    revalidatePath(`/admin/waitlist/${id}`);
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to update waitlist");
  }
}

export async function sendStudentNotification(formData: FormData) {
  try {
    const adminId = await requireAdminAction();
    if (!adminId) return err("Not authenticated");

    const dbAdminId = await getCurrentAdminUserId();
    if (!dbAdminId) return err("Not authenticated");

    const title = formData.get("title") as string;
    const body = formData.get("body") as string;
    const type = (formData.get("type") as string) || "INFO";
    const target = formData.get("target") as string;
    const { campusId, authenticated } = await getCurrentAdminCampusId();
    if (!authenticated) return err("Not authenticated");

    if (!title?.trim() || !body?.trim()) {
      return err("Title and message are required");
    }

    let studentIds: string[] = [];

    if (target === "ALL") {
      const students = await prisma.user.findMany({
        where: { role: "STUDENT", campusId: campusId ?? undefined },
        select: { id: true },
      });
      studentIds = students.map((s) => s.id);
    } else if (target === "CLASS" && formData.get("classId")) {
      const classId = formData.get("classId") as string;
      const enrollments = await prisma.enrollment.findMany({
        where: { classId, status: "ACTIVE" },
        include: { student: { select: { userId: true } } },
      });
      studentIds = enrollments.map((e) => e.student.userId);
    }

    if (studentIds.length === 0) return err("No students found");

    await prisma.studentNotification.createMany({
      data: studentIds.map((studentId) => ({
        studentId,
        title: title.trim(),
        body: body.trim(),
        type,
        createdById: dbAdminId,
        campusId,
      })),
    });

    revalidatePath("/admin/notifications");
    revalidatePath("/student/notifications");
    revalidatePath("/student");
    return { success: true as const, count: studentIds.length };
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to send notification");
  }
}

export async function terminateUserRole(userId: string) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return err("Not authenticated");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { clerkId: true, role: true },
    });
    if (!user) return err("User not found");
    if (user.role === "SUPER_ADMIN")
      return err("Cannot terminate a Super Admin");

    const clerk = await clerkClient();
    await clerk.users.updateUser(user.clerkId, {
      publicMetadata: { role: null },
    });

    revalidatePath("/admin/teachers");
    revalidatePath("/admin/students");
    revalidatePath("/super-admin/admins");
    revalidatePath("/super-admin/teachers");
    revalidatePath("/super-admin/students");
    return {
      success: true as const,
      message: "Role removed. User can no longer access their portal.",
    };
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to terminate role");
  }
}

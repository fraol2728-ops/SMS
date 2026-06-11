"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const ok = { success: true as const };
const err = (error: string) => ({ success: false as const, error });

async function requireSuperAdminAction() {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new Error("Not authenticated");
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "SUPER_ADMIN") throw new Error("Forbidden");
  return userId;
}

export async function createCampus(formData: FormData) {
  try {
    await requireSuperAdminAction();

    const name = formData.get("name") as string;
    const location = formData.get("location") as string;

    if (!name?.trim()) return err("Campus name is required");

    const existing = await prisma.campus.findUnique({
      where: { name: name.trim() },
    });
    if (existing) return err("A campus with this name already exists.");

    await prisma.campus.create({
      data: {
        name: name.trim(),
        location: location?.trim() || null,
      },
    });

    revalidatePath("/super-admin/campuses");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to create campus");
  }
}

export async function createAdmin(formData: FormData) {
  try {
    await requireSuperAdminAction();

    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const phone = formData.get("phone") as string;
    const campusId = formData.get("campusId") as string;

    if (!firstName || !lastName || !email || !campusId) {
      return err("First name, last name, email and campus are required.");
    }

    const campus = await prisma.campus.findUnique({ where: { id: campusId } });
    if (!campus) return err("Selected campus not found.");

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return err("A user with this email already exists.");

    await prisma.user.create({
      data: {
        clerkId: `pending_${Date.now()}`,
        role: "ADMIN",
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email,
        phone: phone?.trim() || null,
        campusId,
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
          publicMetadata: { role: "ADMIN", campusId },
        });
        await prisma.user.update({
          where: { email },
          data: { clerkId: existingClerkUser.id },
        });
      } else {
        await clerk.invitations.createInvitation({
          emailAddress: email,
          publicMetadata: { role: "ADMIN", campusId },
          redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin`,
          ignoreExisting: true,
        });
      }
    } catch (clerkError) {
      console.error("Clerk error:", clerkError);
    }

    revalidatePath("/super-admin/admins");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to create admin");
  }
}

export async function updateAdmin(adminId: string, formData: FormData) {
  try {
    await requireSuperAdminAction();

    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const phone = formData.get("phone") as string;
    const campusId = formData.get("campusId") as string;

    if (!firstName || !lastName || !campusId) {
      return err("First name, last name, and campus are required.");
    }

    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin) return err("Admin not found.");

    const campus = await prisma.campus.findUnique({ where: { id: campusId } });
    if (!campus) return err("Selected campus not found.");

    await prisma.user.update({
      where: { id: adminId },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim() || null,
        campusId,
      },
    });

    revalidatePath("/super-admin/admins");
    revalidatePath(`/super-admin/admins/${adminId}`);
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to update admin");
  }
}

export async function deleteAdmin(adminId: string) {
  try {
    await requireSuperAdminAction();

    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin) return err("Admin not found.");

    await prisma.user.delete({ where: { id: adminId } });

    try {
      const clerk = await clerkClient();
      if (admin.clerkId && !admin.clerkId.startsWith("pending_")) {
        await clerk.users.deleteUser(admin.clerkId);
      }
    } catch (clerkError) {
      // Continue even if Clerk delete fails
    }

    revalidatePath("/super-admin/admins");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to delete admin");
  }
}

export async function moveCampus(studentId: string, newCampusId: string) {
  try {
    await requireSuperAdminAction();

    await prisma.user.update({
      where: { id: studentId },
      data: { campusId: newCampusId },
    });

    await prisma.enrollment.updateMany({
      where: {
        student: { userId: studentId },
        status: "ACTIVE",
      },
      data: {
        status: "DROPPED",
        endDate: new Date(),
      },
    });

    revalidatePath("/super-admin/students");
    revalidatePath("/admin/students");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to move student");
  }
}

export async function updateCampus(id: string, formData: FormData) {
  try {
    await requireSuperAdminAction();

    const name = formData.get("name") as string;
    const location = formData.get("location") as string;
    const color = formData.get("color") as string;
    const isActive = formData.get("isActive") === "true";

    if (!name?.trim()) return err("Campus name is required");

    await prisma.campus.update({
      where: { id },
      data: {
        name: name.trim(),
        location: location?.trim() || null,
        color: color || "blue",
        isActive,
      },
    });

    revalidatePath("/super-admin/campuses");
    revalidatePath(`/super-admin/campuses/${id}/edit`);
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to update campus");
  }
}

export async function updateCoursePrice(courseId: string, formData: FormData) {
  try {
    await requireSuperAdminAction();

    const fee = Number(formData.get("fee"));
    const durationWeeks = Number(formData.get("durationWeeks"));
    const isActive = formData.get("isActive") === "on";

    if (Number.isNaN(fee) || fee < 0) return err("Invalid price");
    if (Number.isNaN(durationWeeks) || durationWeeks <= 0) {
      return err("Invalid duration");
    }

    await prisma.course.update({
      where: { id: courseId },
      data: { fee, durationWeeks, isActive },
    });

    revalidatePath("/super-admin/courses");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to update course");
  }
}

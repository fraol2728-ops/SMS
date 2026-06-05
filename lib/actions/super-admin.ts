"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const ok = { success: true as const };
const err = (error: string) => ({ success: false as const, error });

export async function createCampus(formData: FormData) {
  try {
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
        console.log(`Set ADMIN role directly on existing Clerk user: ${email}`);
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

export async function moveCampus(studentId: string, newCampusId: string) {
  try {
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

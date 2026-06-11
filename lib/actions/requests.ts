"use server";

import { auth } from "@clerk/nextjs/server";
import type { RequestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const ok = { success: true as const };
const err = (error: string) => ({ success: false as const, error });
async function getCurrentUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  return prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, campusId: true },
  });
}
export async function addCourseRequest(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) return err("Not authenticated");
    const firstName = formData.get("firstName") as string,
      lastName = formData.get("lastName") as string,
      phone = formData.get("phone") as string,
      courseName = formData.get("courseName") as string;
    if (
      !firstName?.trim() ||
      !lastName?.trim() ||
      !phone?.trim() ||
      !courseName?.trim()
    )
      return err("First name, last name, phone and course are required");
    await prisma.courseRequest.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        courseName: courseName.trim(),
        notes: ((formData.get("notes") as string) || "").trim() || null,
        campusId: user.campusId,
        addedById: user.id,
        status: "PENDING",
      },
    });
    revalidatePath("/admin/requests");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed");
  }
}
export async function updateRequestStatus(id: string, status: string) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return err("Not authenticated");
    const role = (sessionClaims?.metadata as { role?: string })?.role;
    if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
      return err("Forbidden");
    }

    await prisma.courseRequest.update({
      where: { id },
      data: { status: status as RequestStatus },
    });
    revalidatePath("/admin/requests");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed");
  }
}
export async function deleteRequest(id: string) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return err("Not authenticated");
    const role = (sessionClaims?.metadata as { role?: string })?.role;
    if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
      return err("Forbidden");
    }

    await prisma.courseRequest.delete({ where: { id } });
    revalidatePath("/admin/requests");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed");
  }
}

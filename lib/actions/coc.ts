"use server";

import { auth } from "@clerk/nextjs/server";
import type { PaymentMethod, PaymentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentUser as getAuthorizedUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

const ok = { success: true as const };
const err = (error: string) => ({ success: false as const, error });

async function getCurrentUserId() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  return prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, campusId: true },
  });
}

function nullable(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

export async function addCOCStudentManual(formData: FormData) {
  try {
    const currentUser = await getCurrentUserId();
    if (!currentUser) return err("Not authenticated");
    const fullName = nullable(formData.get("fullName"));
    const paymentAmount = Number(formData.get("paymentAmount"));
    if (!fullName) return err("Full name is required");
    if (!paymentAmount || paymentAmount <= 0)
      return err("Payment amount is required");
    const paymentStatus = (nullable(formData.get("paymentStatus")) ??
      "PENDING") as PaymentStatus;
    await prisma.cOCStudent.create({
      data: {
        fullName,
        gender: nullable(formData.get("gender")),
        phone: nullable(formData.get("phone")),
        regNo: nullable(formData.get("regNo")),
        paymentAmount,
        paymentStatus,
        paymentMethod:
          paymentStatus === "PAID"
            ? (nullable(formData.get("paymentMethod")) as PaymentMethod)
            : null,
        examDate: nullable(formData.get("examDate"))
          ? new Date(String(formData.get("examDate")))
          : null,
        notes: nullable(formData.get("notes")),
        campusId: currentUser.campusId,
        addedById: currentUser.id,
      },
    });
    revalidatePath("/admin/coc");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to add COC student");
  }
}

export async function addCOCStudentFromProfile(
  studentProfileId: string,
  formData: FormData,
) {
  try {
    const currentUser = await getCurrentUserId();
    if (!currentUser) return err("Not authenticated");
    const fullName = nullable(formData.get("fullName"));
    const paymentAmount = Number(formData.get("paymentAmount"));
    if (!fullName) return err("Full name is required");
    if (!paymentAmount || paymentAmount <= 0)
      return err("Payment amount is required");
    const paymentStatus = (nullable(formData.get("paymentStatus")) ??
      "PENDING") as PaymentStatus;
    await prisma.cOCStudent.create({
      data: {
        studentProfileId,
        fullName,
        gender: nullable(formData.get("gender")),
        phone: nullable(formData.get("phone")),
        regNo: nullable(formData.get("regNo")),
        paymentAmount,
        paymentStatus,
        paymentMethod:
          paymentStatus === "PAID"
            ? (nullable(formData.get("paymentMethod")) as PaymentMethod)
            : null,
        examDate: nullable(formData.get("examDate"))
          ? new Date(String(formData.get("examDate")))
          : null,
        notes: nullable(formData.get("notes")),
        campusId: currentUser.campusId,
        addedById: currentUser.id,
      },
    });
    revalidatePath("/admin/coc");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed");
  }
}

export async function updateCOCStudent(id: string, formData: FormData) {
  try {
    const user = await getAuthorizedUser();
    if (!user) return err("Not authenticated");
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return err("Forbidden");
    }

    const paymentStatus = (nullable(formData.get("paymentStatus")) ??
      "PENDING") as PaymentStatus;
    await prisma.cOCStudent.update({
      where: { id },
      data: {
        paymentStatus,
        paymentMethod:
          paymentStatus === "PAID"
            ? (nullable(formData.get("paymentMethod")) as PaymentMethod)
            : null,
        result: nullable(formData.get("result")),
        examDate: nullable(formData.get("examDate"))
          ? new Date(String(formData.get("examDate")))
          : null,
        notes: nullable(formData.get("notes")),
      },
    });
    revalidatePath("/admin/coc");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed");
  }
}

export async function deleteCOCStudent(id: string) {
  try {
    const user = await getAuthorizedUser();
    if (!user) return err("Not authenticated");
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return err("Forbidden");
    }

    await prisma.cOCStudent.delete({ where: { id } });
    revalidatePath("/admin/coc");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed");
  }
}

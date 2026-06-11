"use server";

import { auth } from "@clerk/nextjs/server";
import type { Gender } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const ok = { success: true as const };
const err = (error: string) => ({ success: false as const, error });

async function getCurrentDbUserId() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  return user?.id ?? null;
}

export async function getAdminSettings() {
  try {
    const userId = await getCurrentDbUserId();
    if (!userId) return null;

    const settings = await prisma.adminSettings.findUnique({
      where: { userId },
    });

    if (settings) return settings;

    return await prisma.adminSettings.create({
      data: { userId },
    });
  } catch {
    return null;
  }
}

export async function updateProfileSettings(formData: FormData) {
  try {
    const userId = await getCurrentDbUserId();
    if (!userId) return err("Not authenticated");

    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const phone = formData.get("phone") as string;
    const gender = formData.get("gender") as string;
    const address = formData.get("address") as string;

    await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: firstName?.trim(),
        lastName: lastName?.trim(),
        phone: phone?.trim() || null,
        gender: gender ? (gender as Gender) : null,
        address: address?.trim() || null,
      },
    });

    revalidatePath("/admin/settings");
    revalidatePath("/admin");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed");
  }
}

export async function updateDashboardSettings(data: {
  dashboardCards: string[];
  dashboardDefaultView: string;
  dashboardPinnedActions: string[];
}) {
  try {
    const userId = await getCurrentDbUserId();
    if (!userId) return err("Not authenticated");

    await prisma.adminSettings.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/settings");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed");
  }
}

export async function updateNotificationSettings(data: {
  emailNotifications: boolean;
  notifyOverduePayments: boolean;
  notifyTeacherReports: boolean;
  notifyClassEndingSoon: boolean;
  notifyClassFull: boolean;
  notificationFrequency: string;
}) {
  try {
    const userId = await getCurrentDbUserId();
    if (!userId) return err("Not authenticated");

    await prisma.adminSettings.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });

    revalidatePath("/admin/settings");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed");
  }
}

export async function updatePaymentSettings(data: {
  paymentGracePeriodDays: number;
  defaultCertificateFee: number;
  paymentReminderDaysBefore: number;
}) {
  try {
    const userId = await getCurrentDbUserId();
    if (!userId) return err("Not authenticated");

    await prisma.adminSettings.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });

    revalidatePath("/admin/settings");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed");
  }
}

export async function updateClassSettings(data: {
  defaultClassCapacity: number;
  defaultCourseDuration: number;
}) {
  try {
    const userId = await getCurrentDbUserId();
    if (!userId) return err("Not authenticated");

    await prisma.adminSettings.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });

    revalidatePath("/admin/settings");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed");
  }
}

export async function updateAppearanceSettings(data: {
  sidebarTheme: string;
  colorMode: string;
  accentColor: string;
  calendarSystem: string;
  dateFormat: string;
  timeFormat: string;
}) {
  try {
    const userId = await getCurrentDbUserId();
    if (!userId) return err("Not authenticated");

    await prisma.adminSettings.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });

    revalidatePath("/admin/settings");
    revalidatePath("/admin");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed");
  }
}

export async function exportData(type: "students" | "payments" | "history") {
  try {
    const userId = await getCurrentDbUserId();
    if (!userId) return err("Not authenticated");
    return { success: true as const, type };
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed");
  }
}

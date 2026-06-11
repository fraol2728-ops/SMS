"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const ok = { success: true as const };
const err = (error: string) => ({ success: false as const, error });

async function getCurrentUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  return prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, campusId: true, role: true },
  });
}

export async function createEvent(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) return err("Not authenticated");

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const date = formData.get("date") as string;
    const time = formData.get("time") as string;
    const location = formData.get("location") as string;
    const thumbnailUrl = formData.get("thumbnailUrl") as string;
    const targetAll = formData.get("targetAll") === "true";
    const targetClassIdsRaw = formData.get("targetClassIds") as string;

    if (!title?.trim()) return err("Title is required");
    if (!description?.trim()) return err("Description is required");
    if (!date) return err("Date is required");
    if (!time?.trim()) return err("Time is required");

    const targetClassIds = targetClassIdsRaw
      ? targetClassIdsRaw.split(",").filter(Boolean)
      : [];

    await prisma.event.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        date: new Date(date),
        time: time.trim(),
        location: location?.trim() || null,
        thumbnailUrl: thumbnailUrl?.trim() || null,
        campusId: user.campusId,
        createdById: user.id,
        isActive: true,
        targetAll,
        targetClassIds,
      },
    });

    revalidatePath("/admin/events");
    revalidatePath("/teacher/events");
    revalidatePath("/student/events");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to create event");
  }
}

export async function deleteEvent(eventId: string) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return err("Not authenticated");
    const role = (sessionClaims?.metadata as { role?: string })?.role;
    if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
      return err("Forbidden");
    }

    await prisma.event.delete({ where: { id: eventId } });
    revalidatePath("/admin/events");
    revalidatePath("/teacher/events");
    revalidatePath("/student/events");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to delete event");
  }
}

export async function updateEvent(eventId: string, formData: FormData) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return err("Not authenticated");
    const role = (sessionClaims?.metadata as { role?: string })?.role;
    if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
      return err("Forbidden");
    }

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const date = formData.get("date") as string;
    const time = formData.get("time") as string;
    const location = formData.get("location") as string;
    const thumbnailUrl = formData.get("thumbnailUrl") as string;
    const isActive = formData.get("isActive") === "true";

    await prisma.event.update({
      where: { id: eventId },
      data: {
        title: title.trim(),
        description: description.trim(),
        date: new Date(date),
        time: time.trim(),
        location: location?.trim() || null,
        thumbnailUrl: thumbnailUrl?.trim() || null,
        isActive,
      },
    });

    revalidatePath("/admin/events");
    revalidatePath("/teacher/events");
    revalidatePath("/student/events");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to update event");
  }
}



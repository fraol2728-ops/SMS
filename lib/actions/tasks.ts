"use server";

import { auth } from "@clerk/nextjs/server";
import type { TaskPriority, TaskStatus } from "@prisma/client";
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

export async function createTask(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) return err("Not authenticated");
    const title = formData.get("title") as string;
    if (!title?.trim()) return err("Title is required");
    const dueDate = formData.get("dueDate") as string;
    const assigneeId = formData.get("assigneeId") as string;
    await prisma.task.create({
      data: {
        title: title.trim(),
        description:
          ((formData.get("description") as string) || "").trim() || null,
        priority: ((formData.get("priority") as string) ||
          "MEDIUM") as TaskPriority,
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId || user.id,
        createdById: user.id,
        campusId: user.campusId,
        status: "PENDING",
      },
    });
    revalidatePath("/admin/tasks");
    revalidatePath("/teacher/tasks");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to create task");
  }
}

export async function completeTask(taskId: string, note: string | null) {
  try {
    const user = await getCurrentUser();
    if (!user) return err("Not authenticated");
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        completedNote: note?.trim() || null,
      },
    });
    revalidatePath("/admin/tasks");
    revalidatePath("/teacher/tasks");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed");
  }
}

export async function cancelTask(taskId: string) {
  try {
    const { userId } = await auth();
    if (!userId) return err("Not authenticated");

    await prisma.task.update({
      where: { id: taskId },
      data: { status: "CANCELLED" },
    });
    revalidatePath("/admin/tasks");
    revalidatePath("/teacher/tasks");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed");
  }
}

export async function updateTaskStatus(taskId: string, status: string) {
  try {
    const { userId } = await auth();
    if (!userId) return err("Not authenticated");

    await prisma.task.update({
      where: { id: taskId },
      data: { status: status as TaskStatus },
    });
    revalidatePath("/admin/tasks");
    revalidatePath("/teacher/tasks");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed");
  }
}

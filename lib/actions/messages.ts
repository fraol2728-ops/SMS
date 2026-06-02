"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const ok = { success: true as const };
const err = (error: string) => ({ success: false as const, error });

async function getCurrentUserId() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  return user?.id;
}

export async function sendMessage(formData: FormData) {
  try {
    const senderId = await getCurrentUserId();
    if (!senderId) return err("Not authenticated");
    const receiverId = formData.get("receiverId") as string;
    const subject = formData.get("subject") as string;
    const body = formData.get("body") as string;
    const parentId = formData.get("parentId") as string | null;
    if (!receiverId || !subject?.trim() || !body?.trim())
      return err("Receiver, subject, and body are required");
    await prisma.message.create({
      data: {
        senderId,
        receiverId,
        subject: subject.trim(),
        body: body.trim(),
        parentId: parentId || null,
      },
    });
    revalidatePath("/admin/mail");
    revalidatePath("/teacher/mail");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to send message");
  }
}
export async function markMessageRead(messageId: string) {
  try {
    await prisma.message.update({
      where: { id: messageId },
      data: { isRead: true, readAt: new Date() },
    });
    revalidatePath("/admin/mail");
    revalidatePath("/teacher/mail");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed");
  }
}
export async function deleteMessage(messageId: string) {
  try {
    await prisma.message.delete({ where: { id: messageId } });
    revalidatePath("/admin/mail");
    revalidatePath("/teacher/mail");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed");
  }
}

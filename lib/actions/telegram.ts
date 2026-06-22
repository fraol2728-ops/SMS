"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

const ok = { success: true as const };
const err = (error: string) => ({ success: false as const, error });

async function requireSuperAdmin() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (user?.role !== "SUPER_ADMIN") return null;
  return user;
}

async function canAccessScheduler(create = false) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return null;
  if (user.role === "SUPER_ADMIN") return user;

  const access = await prisma.schedulerAccess.findUnique({
    where: { userId: user.id },
  });
  if (!access) return null;
  if (create && !access.canCreate) return null;
  if (!create && !access.canView) return null;
  return user;
}

export async function publishToTelegram(
  channelId: string,
  content: string,
  imageUrl?: string,
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized");
  }

  try {
    const channel = await prisma.telegramChannel.findUnique({
      where: { id: channelId },
    });
    if (!channel) return err("Channel not found");

    const endpoint = imageUrl
      ? `https://api.telegram.org/bot${channel.botToken}/sendPhoto`
      : `https://api.telegram.org/bot${channel.botToken}/sendMessage`;
    const body = imageUrl
      ? { chat_id: channel.chatId, photo: imageUrl, caption: content }
      : { chat_id: channel.chatId, text: content };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.ok) return err(data.description ?? "Telegram API error");
    return ok;
  } catch (e) {
    return err(
      e instanceof Error ? e.message : "Failed to publish to Telegram",
    );
  }
}

export async function createScheduledPost(formData: FormData) {
  try {
    const user = await canAccessScheduler(true);
    if (!user) return err("You do not have permission to create posts");

    const channelId = formData.get("channelId") as string;
    const content = formData.get("content") as string;
    const imageUrl = formData.get("imageUrl") as string;
    const scheduledFor = formData.get("scheduledFor") as string;
    const aiGenerated = formData.get("aiGenerated") === "true";
    const publishNow = formData.get("publishNow") === "true";

    if (!channelId || !content?.trim() || !scheduledFor)
      return err("Missing required fields");

    const scheduledDate = new Date(scheduledFor);
    if (Number.isNaN(scheduledDate.getTime()))
      return err("Invalid scheduled date");

    const post = await prisma.scheduledPost.create({
      data: {
        channelId,
        content: content.trim(),
        imageUrl: imageUrl?.trim() || null,
        scheduledFor: scheduledDate,
        createdById: user.id,
        aiGenerated,
        status: "SCHEDULED",
      },
    });

    if (publishNow || scheduledDate <= new Date()) {
      const result = await publishToTelegram(
        channelId,
        content.trim(),
        imageUrl || undefined,
      );
      await prisma.scheduledPost.update({
        where: { id: post.id },
        data: result.success
          ? { status: "PUBLISHED", publishedAt: new Date() }
          : { status: "FAILED", errorMessage: result.error },
      });
    }

    revalidatePath("/super-admin/scheduler");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to create post");
  }
}

export async function cancelScheduledPost(postId: string) {
  try {
    const user = await canAccessScheduler(true);
    if (!user) return err("Not authorized");
    await prisma.scheduledPost.update({
      where: { id: postId },
      data: { status: "CANCELLED" },
    });
    revalidatePath("/super-admin/scheduler");
    return ok;
  } catch {
    return err("Failed to cancel post");
  }
}

export async function createTelegramChannel(formData: FormData) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return err("Only Super Admin can add channels");
    const name = formData.get("name") as string;
    const chatId = formData.get("chatId") as string;
    const botToken = formData.get("botToken") as string;
    const campusId = formData.get("campusId") as string;
    if (!name?.trim() || !chatId?.trim() || !botToken?.trim())
      return err("All fields are required");
    await prisma.telegramChannel.create({
      data: {
        name: name.trim(),
        chatId: chatId.trim(),
        botToken: botToken.trim(),
        campusId: campusId || null,
      },
    });
    revalidatePath("/super-admin/scheduler");
    return ok;
  } catch {
    return err("Failed to add channel");
  }
}

export async function setSchedulerAccess(
  userId: string,
  canView: boolean,
  canCreate: boolean,
) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return err("Only Super Admin can manage access");
    await prisma.schedulerAccess.upsert({
      where: { userId },
      create: { userId, canView, canCreate, grantedById: admin.id },
      update: { canView, canCreate, grantedById: admin.id },
    });
    revalidatePath("/super-admin/scheduler/access");
    return ok;
  } catch {
    return err("Failed to update access");
  }
}

export async function getSchedulerAccessList() {
  const admin = await requireSuperAdmin();
  if (!admin) return [];
  return prisma.user.findMany({
    where: { role: { in: ["ADMIN", "TEACHER"] } },
    include: { schedulerAccess: true },
    orderBy: { firstName: "asc" },
  });
}

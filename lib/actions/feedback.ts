"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const ok = { success: true as const };
const err = (error: string) => ({ success: false as const, error });

function hasBeenAWeek(lastDate: Date | null | undefined): boolean {
  if (!lastDate) return true;

  const now = new Date();
  const diffMs = now.getTime() - new Date(lastDate).getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays >= 7;
}

export async function submitFeedback(formData: FormData) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return err("Not authenticated");

    const student = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, studentProfile: { select: { id: true } } },
    });
    if (!student?.studentProfile) return err("Student not found");

    const enrollmentId = formData.get("enrollmentId") as string;
    const classId = formData.get("classId") as string;
    const classFeedbackRaw = formData.get("classFeedback") as string;
    const teacherFeedbackRaw = formData.get("teacherFeedback") as string;
    const problemsRaw = formData.get("problemsReported") as string;
    const comment = formData.get("comment") as string;
    const ratingRaw = formData.get("rating") as string;
    const fromModal = formData.get("fromModal") === "true";

    if (!enrollmentId || !classId) return err("Missing enrollment or class");

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        id: enrollmentId,
        studentId: student.studentProfile.id,
        classId,
      },
      select: { id: true },
    });
    if (!enrollment) return err("Enrollment not found");

    const classFeedback = classFeedbackRaw
      ? classFeedbackRaw.split("||").filter(Boolean)
      : [];
    const teacherFeedback = teacherFeedbackRaw
      ? teacherFeedbackRaw.split("||").filter(Boolean)
      : [];
    const problemsReported = problemsRaw
      ? problemsRaw.split("||").filter(Boolean)
      : [];
    const rating = ratingRaw ? Number(ratingRaw) : null;

    if (
      rating !== null &&
      (!Number.isInteger(rating) || rating < 1 || rating > 5)
    ) {
      return err("Rating must be between 1 and 5");
    }

    const existing = await prisma.studentFeedback.findUnique({
      where: { enrollmentId },
      select: { id: true, rating: true, ratedAt: true, lastSubmittedAt: true },
    });

    const now = new Date();

    if (existing) {
      await prisma.studentFeedback.update({
        where: { enrollmentId },
        data: {
          classFeedback,
          teacherFeedback,
          problemsReported,
          comment: comment?.trim() || null,
          ...(existing.rating === null && rating !== null
            ? {
                rating,
                ratedAt: now,
              }
            : {}),
          ...(fromModal ? { lastSubmittedAt: now } : {}),
        },
      });
    } else {
      await prisma.studentFeedback.create({
        data: {
          studentId: student.id,
          enrollmentId,
          classId,
          classFeedback,
          teacherFeedback,
          problemsReported,
          comment: comment?.trim() || null,
          rating: rating ?? null,
          ratedAt: rating !== null ? now : null,
          lastSubmittedAt: fromModal ? now : null,
        },
      });
    }

    revalidatePath("/student/feedback");
    revalidatePath("/admin/feedback");
    revalidatePath("/super-admin/feedback");

    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to submit feedback");
  }
}

export async function getFeedbackForEnrollment(enrollmentId: string) {
  try {
    return await prisma.studentFeedback.findUnique({
      where: { enrollmentId },
      select: {
        id: true,
        classFeedback: true,
        teacherFeedback: true,
        problemsReported: true,
        comment: true,
        rating: true,
        ratedAt: true,
        lastSubmittedAt: true,
      },
    });
  } catch {
    return null;
  }
}

export async function shouldShowFeedbackModal(
  enrollmentId: string,
): Promise<boolean> {
  try {
    const feedback = await prisma.studentFeedback.findUnique({
      where: { enrollmentId },
      select: { lastSubmittedAt: true },
    });

    return hasBeenAWeek(feedback?.lastSubmittedAt);
  } catch {
    return true;
  }
}

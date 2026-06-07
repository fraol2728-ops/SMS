export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { MessageSquare, Shield } from "lucide-react";
import { redirect } from "next/navigation";
import { FeedbackForm } from "@/components/student/FeedbackForm";
import { getFeedbackForEnrollment } from "@/lib/actions/feedback";
import { prisma } from "@/lib/prisma";

export default async function StudentFeedbackPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const student = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      studentProfile: {
        include: {
          enrollments: {
            where: { status: "ACTIVE" },
            include: {
              class: {
                include: {
                  course: true,
                  lab: true,
                  teacher: { include: { user: true } },
                },
              },
            },
            take: 1,
          },
        },
      },
    },
  });

  if (!student?.studentProfile) redirect("/unauthorized");

  const activeEnrollment = student.studentProfile.enrollments[0];

  if (!activeEnrollment?.classId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-black text-2xl text-gray-900">Feedback</h1>
          <p className="mt-1 text-gray-500">Share your experience</p>
        </div>
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-16 text-center">
          <MessageSquare size={48} className="mx-auto mb-4 text-gray-200" />
          <h2 className="font-bold text-gray-400 text-lg">
            No active enrollment
          </h2>
          <p className="mt-2 text-gray-300 text-sm">
            You need to be enrolled in a class to submit feedback.
          </p>
        </div>
      </div>
    );
  }

  const existingFeedback = await getFeedbackForEnrollment(activeEnrollment.id);
  const classInfo = activeEnrollment.class;
  const teacherName = classInfo?.teacher
    ? `${classInfo.teacher.user.firstName} ${classInfo.teacher.user.lastName}`
    : "Your teacher";

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-black text-2xl text-gray-900">Feedback</h1>
        <p className="mt-1 text-gray-500">Your feedback helps us improve</p>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500">
          <Shield size={17} className="text-white" />
        </div>
        <div>
          <p className="font-semibold text-blue-800 text-sm">
            Your feedback is confidential
          </p>
          <p className="mt-0.5 text-blue-600 text-xs">
            Feel free to submit feedback — it is visible to support teams only
            and kept confidential.
          </p>
        </div>
      </div>

      <div className="rounded-3xl bg-gradient-to-r from-blue-500 to-indigo-600 p-5 text-white">
        <p className="mb-1 font-semibold text-blue-100 text-xs">Feedback for</p>
        <h2 className="font-black text-xl">{classInfo?.course?.title}</h2>
        <p className="mt-1 text-blue-100 text-sm">
          {classInfo?.lab?.name ?? "Online"} • Teacher: {teacherName}
        </p>
        {existingFeedback && (
          <div className="mt-3 inline-block rounded-xl bg-white/15 px-3 py-2">
            <p className="font-medium text-white text-xs">
              ✓ You've submitted feedback — you can update it anytime below
            </p>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <FeedbackForm
          enrollmentId={activeEnrollment.id}
          classId={activeEnrollment.classId}
          existingFeedback={existingFeedback}
          fromModal={false}
        />
      </div>
    </div>
  );
}

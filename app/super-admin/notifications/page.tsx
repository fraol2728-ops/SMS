export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminNotificationsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const currentUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!currentUser) redirect("/sign-in");

  const reports = await prisma.report.findMany({
    where: { receiverId: currentUser.id },
    include: {
      sender: { select: { firstName: true, lastName: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const studentIds = reports
    .map((report) => report.studentId)
    .filter((id): id is string => Boolean(id));
  const students = studentIds.length
    ? await prisma.studentProfile.findMany({
        where: { id: { in: studentIds } },
        include: { user: { select: { firstName: true, lastName: true } } },
      })
    : [];
  const studentsById = new Map(
    students.map((student) => [student.id, student]),
  );

  const unreadCount = reports.filter((r) => r.status === "UNREAD").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="font-bold text-2xl dark:text-white">Notifications</h1>
        {unreadCount > 0 ? (
          <span className="rounded-full bg-red-500 px-2 py-1 text-white text-xs">
            {unreadCount} unread
          </span>
        ) : null}
      </div>

      {reports.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="mb-3 text-4xl">🔔</p>
          <p className="font-semibold dark:text-white">No notifications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div
              key={r.id}
              className={`rounded-xl border bg-white p-5 dark:border-gray-700 dark:bg-gray-900 ${r.status === "UNREAD" ? "border-l-4 border-l-blue-500" : ""}`}
            >
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    {r.status === "UNREAD" ? (
                      <span className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                    ) : null}
                    <p className="font-semibold dark:text-white">{r.title}</p>
                  </div>
                  <p className="text-gray-400 text-xs">
                    From: {r.sender.firstName} {r.sender.lastName} (
                    {r.sender.role}) •{" "}
                    {new Date(r.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {r.studentId && studentsById.get(r.studentId) ? (
                    <p className="mt-0.5 text-blue-600 text-xs dark:text-blue-400">
                      Re: {studentsById.get(r.studentId)?.user.firstName}{" "}
                      {studentsById.get(r.studentId)?.user.lastName}
                    </p>
                  ) : null}
                </div>
                <span
                  className={`flex-shrink-0 rounded-full px-2 py-1 text-xs ${
                    r.status === "UNREAD"
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : r.status === "READ"
                        ? "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                        : "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  }`}
                >
                  {r.status}
                </span>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                <p className="whitespace-pre-wrap text-gray-700 text-sm dark:text-gray-300">
                  {r.content}
                </p>
              </div>
              {r.replyContent ? (
                <div className="mt-2 rounded-xl bg-blue-50 p-3 dark:bg-blue-900/20">
                  <p className="mb-1 font-medium text-blue-600 text-xs dark:text-blue-400">
                    Your reply:
                  </p>
                  <p className="text-gray-700 text-sm dark:text-gray-300">
                    {r.replyContent}
                  </p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

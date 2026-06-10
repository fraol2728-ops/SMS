export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import type { LucideIcon } from "lucide-react";
import {
  ExternalLink,
  File,
  FileText,
  FolderOpen,
  Link2,
  Video,
} from "lucide-react";
import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth-check";
import { prisma } from "@/lib/prisma";

const TYPE_CONFIG: Record<
  string,
  { icon: LucideIcon; color: string; bg: string }
> = {
  LINK: { icon: Link2, color: "text-blue-600", bg: "bg-blue-50" },
  PDF: { icon: FileText, color: "text-red-600", bg: "bg-red-50" },
  VIDEO: { icon: Video, color: "text-purple-600", bg: "bg-purple-50" },
  DOCUMENT: { icon: File, color: "text-green-600", bg: "bg-green-50" },
  OTHER: { icon: FolderOpen, color: "text-gray-600", bg: "bg-gray-100" },
};

export default async function StudentMaterialsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const student = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      studentProfile: { select: { studentCode: true } },
    },
  });
  if (!student) redirect("/sign-in");

  const enrollment = await prisma.enrollment.findFirst({
    where: { student: { userId: student.id }, status: "ACTIVE" },
    include: {
      class: {
        include: {
          course: true,
          lab: true,
          teacher: {
            include: {
              user: {
                select: {
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          materials: {
            include: {
              uploadedBy: { select: { firstName: true, lastName: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  const materials = enrollment?.class?.materials ?? [];
  const teacherEmail = enrollment?.class?.teacher?.user?.email;
  const courseName = enrollment?.class?.course?.title ?? "Course";
  const studentName = `${student.firstName} ${student.lastName}`;
  const studentCode = student.studentProfile?.studentCode ?? "-";
  const subject = encodeURIComponent(`Assignment Submission — ${courseName}`);
  const body = encodeURIComponent(
    `Dear Teacher,

Please find my assignment submission for ${courseName} attached.

Student: ${studentName}
Student Code: ${studentCode}

Best regards,
${studentName}`,
  );
  const mailtoLink =
    teacherEmail && !teacherEmail.includes("@exceed.local")
      ? `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(teacherEmail)}&su=${subject}&body=${body}`
      : null;

  const byType: Record<string, typeof materials> = {};
  materials.forEach((m) => {
    if (!byType[m.type]) byType[m.type] = [];
    byType[m.type].push(m);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Materials</h1>
        <p className="text-gray-500 mt-1">
          {enrollment?.class?.course?.title
            ? `Resources for ${enrollment.class.course.title}`
            : "Course materials and resources"}
        </p>
      </div>

      {mailtoLink ? (
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-bold text-gray-900">Submit Assignment</h3>
            <p className="mt-0.5 text-gray-500 text-sm">
              Send your completed work directly to your teacher
            </p>
          </div>
          <a
            href={mailtoLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-sm text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.908 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
            </svg>
            Submit via Gmail
          </a>
        </div>
      ) : null}

      {materials.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-16 text-center shadow-sm">
          <FolderOpen size={48} className="mx-auto text-gray-200 mb-4" />
          <h2 className="font-bold text-gray-400 text-lg">No materials yet</h2>
          <p className="text-gray-300 text-sm mt-2">
            Your teacher hasn&apos;t uploaded any materials yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byType).map(([type, items]) => {
            const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.OTHER;
            const Icon = config.icon;
            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`w-7 h-7 ${config.bg} rounded-lg flex items-center justify-center`}
                  >
                    <Icon size={14} className={config.color} />
                  </div>
                  <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">
                    {type === "LINK"
                      ? "Links"
                      : type === "PDF"
                        ? "PDFs"
                        : type === "VIDEO"
                          ? "Videos"
                          : type === "DOCUMENT"
                            ? "Documents"
                            : "Other"}
                    <span className="ml-2 text-gray-300 font-normal normal-case">
                      ({items.length})
                    </span>
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {items.map((m) => {
                    const mConfig = TYPE_CONFIG[m.type] ?? TYPE_CONFIG.OTHER;
                    const MIcon = mConfig.icon;
                    return (
                      <a
                        key={m.id}
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-blue-200 transition-all group flex items-start gap-4"
                      >
                        <div
                          className={`w-11 h-11 ${mConfig.bg} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
                        >
                          <MIcon size={20} className={mConfig.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors">
                            {m.title}
                          </p>
                          {m.description && (
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                              {m.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-300 mt-1">
                            by {m.uploadedBy.firstName} {m.uploadedBy.lastName}{" "}
                            •{" "}
                            {new Date(m.createdAt).toLocaleDateString("en-GB")}
                          </p>
                        </div>
                        <ExternalLink
                          size={14}
                          className="text-gray-300 group-hover:text-blue-500 flex-shrink-0 mt-0.5 transition-colors"
                        />
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

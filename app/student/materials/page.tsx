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
    select: { id: true },
  });
  if (!student) redirect("/sign-in");

  const enrollment = await prisma.enrollment.findFirst({
    where: { student: { userId: student.id }, status: "ACTIVE" },
    include: {
      class: {
        include: {
          course: true,
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

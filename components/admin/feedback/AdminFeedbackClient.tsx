"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import * as XLSX from "xlsx";

type FeedbackClass = {
  course?: { title?: string | null } | null;
  lab?: { name?: string | null } | null;
  teacher?: {
    user: { firstName?: string | null; lastName?: string | null };
  } | null;
} | null;

type AdminFeedback = {
  id: string;
  student: { firstName?: string | null; lastName?: string | null };
  class: FeedbackClass;
  classFeedback: string[];
  teacherFeedback: string[];
  problemsReported: string[];
  comment: string | null;
  rating: number | null;
  createdAt: Date | string;
};

export function AdminFeedbackClient({
  feedbacks,
}: {
  feedbacks: AdminFeedback[];
}) {
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | "all">("all");

  const filtered = feedbacks.filter((f) => {
    const name = `${f.student.firstName} ${f.student.lastName}`.toLowerCase();
    const course = f.class?.course?.title?.toLowerCase() ?? "";
    const matchesSearch =
      !search ||
      name.includes(search.toLowerCase()) ||
      course.includes(search.toLowerCase());
    const matchesRating = ratingFilter === "all" || f.rating === ratingFilter;
    return matchesSearch && matchesRating;
  });

  function handleExport() {
    const headers = [
      "Student",
      "Course",
      "Lab",
      "Teacher",
      "Class Feedback",
      "Teacher Feedback",
      "Problems",
      "Comment",
      "Rating",
      "Date",
    ];
    const rows = feedbacks.map((f) => [
      `${f.student.firstName} ${f.student.lastName}`,
      f.class?.course?.title ?? "",
      f.class?.lab?.name ?? "Online",
      f.class?.teacher
        ? `${f.class.teacher.user.firstName} ${f.class.teacher.user.lastName}`
        : "",
      f.classFeedback.join("; "),
      f.teacherFeedback.join("; "),
      f.problemsReported.join("; "),
      f.comment ?? "",
      f.rating ?? "",
      new Date(f.createdAt).toLocaleDateString("en-GB"),
    ]);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = headers.map(() => ({ wch: 22 }));
    XLSX.utils.book_append_sheet(wb, ws, "Feedback");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const bytes = new Uint8Array(buffer);
    const arrayBuffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;
    const blob = new Blob([arrayBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedback-${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Search by student or course..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 flex-1 rounded-xl border bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-800"
        />
        <div className="flex flex-wrap gap-2">
          {(["all", 1, 2, 3, 4, 5] as const).map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setRatingFilter(r)}
              className={`rounded-xl px-3 py-2 font-medium text-sm transition-all ${
                ratingFilter === r
                  ? "bg-amber-500 text-white"
                  : "border bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              {r === "all" ? "All" : "★".repeat(Number(r))}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2 font-medium text-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <Download size={14} />
          Export
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-gray-400">No feedback yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((f) => (
            <div
              key={f.id}
              className="rounded-2xl border bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {f.student.firstName} {f.student.lastName}
                  </p>
                  <p className="text-gray-500 text-sm dark:text-gray-400">
                    {f.class?.course?.title} • {f.class?.lab?.name ?? "Online"}
                  </p>
                  <p className="mt-0.5 text-gray-400 text-xs">
                    Teacher:{" "}
                    {f.class?.teacher
                      ? `${f.class.teacher.user.firstName} ${f.class.teacher.user.lastName}`
                      : "—"}
                  </p>
                </div>
                {f.rating && (
                  <div className="text-right">
                    <p className="font-bold text-amber-500 text-lg">
                      {"★".repeat(f.rating)}
                      {"☆".repeat(5 - f.rating)}
                    </p>
                    <p className="text-gray-400 text-xs">{f.rating}/5</p>
                  </div>
                )}
              </div>

              {f.classFeedback.length > 0 && (
                <div className="mb-3">
                  <p className="mb-2 font-bold text-blue-600 text-xs dark:text-blue-400">
                    CLASS FEEDBACK
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {f.classFeedback.map((item: string) => (
                      <span
                        key={item}
                        className="rounded-full bg-blue-50 px-2 py-1 text-blue-700 text-xs dark:bg-blue-900/30 dark:text-blue-400"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {f.teacherFeedback.length > 0 && (
                <div className="mb-3">
                  <p className="mb-2 font-bold text-green-600 text-xs dark:text-green-400">
                    TEACHER FEEDBACK
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {f.teacherFeedback.map((item: string) => (
                      <span
                        key={item}
                        className="rounded-full bg-green-50 px-2 py-1 text-green-700 text-xs dark:bg-green-900/30 dark:text-green-400"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {f.problemsReported.length > 0 && (
                <div className="mb-3">
                  <p className="mb-2 font-bold text-amber-600 text-xs dark:text-amber-400">
                    ⚠️ PROBLEMS REPORTED
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {f.problemsReported.map((item: string) => (
                      <span
                        key={item}
                        className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-amber-700 text-xs dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {f.comment && (
                <div className="mt-3 border-t pt-3 dark:border-gray-700">
                  <p className="mb-1 font-bold text-gray-400 text-xs">
                    COMMENT
                  </p>
                  <p className="text-gray-700 text-sm italic dark:text-gray-300">
                    &quot;{f.comment}&quot;
                  </p>
                </div>
              )}

              <p className="mt-3 text-gray-300 text-xs dark:text-gray-600">
                Submitted{" "}
                {new Date(f.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

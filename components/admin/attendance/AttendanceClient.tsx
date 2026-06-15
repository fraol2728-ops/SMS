"use client";

import { ChevronLeft, ChevronRight, ClipboardCheck } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type AttendanceRecord = {
  id: string;
  status: string;
  enrollment: {
    student: {
      user: { firstName: string; lastName: string };
    };
  };
};

type ClassInfo = {
  id: string;
  timeSlot?: string | null;
  course: { title: string };
  lab: { name: string } | null;
};

export function AttendanceClient({
  byClass,
  classes,
  dateStr,
  stats,
  currentFilters,
}: {
  byClass: Record<
    string,
    { classInfo: ClassInfo | null; records: AttendanceRecord[] }
  >;
  classes: ClassInfo[];
  dateStr: string;
  stats: { present: number; absent: number; late: number; overallRate: number };
  currentFilters: { classId: string; status: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [filters, setFilters] = useState(currentFilters);

  function apply(newDate?: string, newFilters?: typeof filters) {
    const p = new URLSearchParams();
    p.set("date", newDate ?? dateStr);
    const f = newFilters ?? filters;
    if (f.classId) p.set("classId", f.classId);
    if (f.status) p.set("status", f.status);
    startTransition(() => router.push(`${pathname}?${p.toString()}`));
  }

  function changeDate(offset: number) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + offset);
    apply(d.toISOString().slice(0, 10));
  }

  function update(key: string, value: string) {
    const n = { ...filters, [key]: value };
    setFilters(n);
    apply(undefined, n);
  }

  const total = stats.present + stats.absent + stats.late;
  const rate = total > 0 ? Math.round((stats.present / total) * 100) : 0;
  const classGroups = Object.entries(byClass);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => changeDate(-1)}
          className="p-2 rounded-xl border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft size={18} className="text-gray-600 dark:text-gray-400" />
        </button>
        <input
          type="date"
          value={dateStr}
          onChange={(e) => apply(e.target.value)}
          className="h-10 px-4 rounded-xl border dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => changeDate(1)}
          className="p-2 rounded-xl border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronRight
            size={18}
            className="text-gray-600 dark:text-gray-400"
          />
        </button>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(dateStr).toLocaleDateString("en-GB", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Present",
            value: stats.present,
            color:
              "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400",
          },
          {
            label: "Absent",
            value: stats.absent,
            color:
              "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400",
          },
          {
            label: "Late",
            value: stats.late,
            color:
              "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
          },
          {
            label: "Rate Today",
            value: `${rate}%`,
            color:
              "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className={`${color.split(" ").slice(0, 2).join(" ")} rounded-2xl p-4`}
          >
            <p
              className={`text-3xl font-black ${color.split(" ").slice(2).join(" ")}`}
            >
              {value}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={filters.classId}
          onChange={(e) => update("classId", e.target.value)}
          className="h-9 rounded-xl border dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.lab?.name} — {c.course.title}
            </option>
          ))}
        </select>
        {["", "PRESENT", "ABSENT", "LATE"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => update("status", s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filters.status === s ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-900 border dark:border-gray-700 text-gray-600 dark:text-gray-400"}`}
          >
            {s || "All Status"}
          </button>
        ))}
      </div>

      {classGroups.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-dashed dark:border-gray-700 rounded-2xl p-12 text-center">
          <ClipboardCheck
            size={36}
            className="mx-auto mb-3 text-gray-300 dark:text-gray-600"
          />
          <p className="text-gray-400 font-semibold">
            No attendance recorded for this date
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {classGroups.map(([classId, { classInfo, records }]) => {
            const pres = records.filter((r) => r.status === "PRESENT").length;
            const abs = records.filter((r) => r.status === "ABSENT").length;
            const late = records.filter((r) => r.status === "LATE").length;
            const classRate =
              records.length > 0
                ? Math.round((pres / records.length) * 100)
                : 0;

            return (
              <div
                key={classId}
                className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm"
              >
                <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {classInfo?.course?.title ?? "Unknown Class"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {classInfo?.lab?.name ?? "Online"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2 text-xs">
                      <span className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full font-medium">
                        {pres} present
                      </span>
                      {abs > 0 && (
                        <span className="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full font-medium">
                          {abs} absent
                        </span>
                      )}
                      {late > 0 && (
                        <span className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-full font-medium">
                          {late} late
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-sm font-black ${classRate >= 80 ? "text-green-600" : classRate >= 60 ? "text-amber-600" : "text-red-600"}`}
                    >
                      {classRate}%
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {records.map((r) => (
                      <div
                        key={r.id}
                        title={`${r.enrollment.student.user.firstName} ${r.enrollment.student.user.lastName} — ${r.status}`}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium ${
                          r.status === "PRESENT"
                            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                            : r.status === "ABSENT"
                              ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                              : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        <span>
                          {r.enrollment.student.user.firstName}{" "}
                          {r.enrollment.student.user.lastName[0]}.
                        </span>
                        <span className="font-bold">
                          {r.status === "PRESENT"
                            ? "✓"
                            : r.status === "ABSENT"
                              ? "✗"
                              : "L"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

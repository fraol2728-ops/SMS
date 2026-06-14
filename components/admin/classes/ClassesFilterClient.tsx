"use client";

import {
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";

interface ClassListItem {
  id: string;
  capacity: number;
  status: string;
  timeSlot: string;
  days: string;
  course: { title: string };
  lab?: { name: string } | null;
  teacher: { user: { firstName: string; lastName: string } };
  _count: { enrollments: number };
}

interface CourseOption {
  id: string;
  title: string;
}

interface CourseStudentCount extends CourseOption {
  activeStudents: number;
  totalClasses: number;
}

interface TimeSlotCount {
  slot: string;
  label: string;
  count: number;
}

export function ClassesFilterClient({
  classes,
  courses,
  labs: _labs,
  statusCounts,
  courseStudentCounts,
  timeSlotCounts,
  scheduleCounts,
  typeCounts,
  currentFilters,
  detailHrefPrefix = "/admin/classes",
  campusId,
}: {
  classes: ClassListItem[];
  courses: CourseOption[];
  labs: { id: string; name: string }[];
  statusCounts: { registration: number; started: number; ended: number };
  courseStudentCounts: CourseStudentCount[];
  timeSlotCounts: TimeSlotCount[];
  scheduleCounts: { mwf: number; tts: number };
  typeCounts: { group: number; personal: number; online: number };
  currentFilters: {
    status: string;
    courseId: string;
    classType: string;
    timeSlot: string;
    days: string;
    labId: string;
  };
  detailHrefPrefix?: string;
  campusId?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useState(currentFilters);
  const [showFilters, setShowFilters] = useState(
    !!(
      currentFilters.courseId ||
      currentFilters.classType ||
      currentFilters.timeSlot ||
      currentFilters.days ||
      currentFilters.labId
    ),
  );
  const [showAnalytics, setShowAnalytics] = useState(true);

  function applyFilters(newFilters: typeof filters) {
    const params = new URLSearchParams();
    if (campusId) params.set("campusId", campusId);
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function updateFilter(key: keyof typeof filters, value: string) {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  }

  function clearFilters() {
    const cleared = {
      status: filters.status,
      courseId: "",
      classType: "",
      timeSlot: "",
      days: "",
      labId: "",
    };
    setFilters(cleared);
    applyFilters(cleared);
  }

  const hasFilters =
    filters.courseId ||
    filters.classType ||
    filters.timeSlot ||
    filters.days ||
    filters.labId;
  const totalActive = courseStudentCounts.reduce(
    (sum, c) => sum + c.activeStudents,
    0,
  );
  const detailSuffix =
    campusId !== undefined ? `?campusId=${campusId ?? ""}` : "";

  return (
    <div className="space-y-5">
      {isPending && (
        <div className="h-1 animate-pulse rounded-full bg-blue-500" />
      )}
      <div className="flex gap-2 flex-wrap">
        {[
          {
            id: "REGISTRATION",
            label: "📋 Registration",
            count: statusCounts.registration,
          },
          { id: "STARTED", label: "🚀 Started", count: statusCounts.started },
          { id: "ENDED", label: "🏁 Ended", count: statusCounts.ended },
          {
            id: "ALL",
            label: "All",
            count:
              statusCounts.registration +
              statusCounts.started +
              statusCounts.ended,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => updateFilter("status", tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${filters.status === tab.id ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-900 border dark:border-gray-700 text-gray-600 dark:text-gray-400"}`}
          >
            {tab.label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${filters.status === tab.id ? "bg-white/20" : "bg-gray-100 dark:bg-gray-700"}`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setShowAnalytics((v) => !v)}
        className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <TrendingUp size={16} />
        Analytics Overview
        {showAnalytics ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {showAnalytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-2xl p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm flex items-center gap-2">
              <BookOpen size={15} className="text-blue-500" />
              Students per Course
            </h3>
            <div className="space-y-3">
              {courseStudentCounts.map((c) => {
                const pct =
                  totalActive > 0
                    ? Math.round((c.activeStudents / totalActive) * 100)
                    : 0;
                return (
                  <div key={c.id}>
                    <div className="flex justify-between mb-1">
                      <button
                        type="button"
                        onClick={() =>
                          updateFilter(
                            "courseId",
                            filters.courseId === c.id ? "" : c.id,
                          )
                        }
                        className={`text-xs font-medium transition-colors hover:text-blue-600 ${filters.courseId === c.id ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300"}`}
                      >
                        {c.title}
                      </button>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        {c.activeStudents}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-2xl p-5 space-y-5">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm flex items-center gap-2">
                <Calendar size={15} className="text-green-500" />
                Schedule Breakdown
              </h3>
              <div className="space-y-3">
                {[
                  {
                    label: "M / W / F",
                    value: scheduleCounts.mwf,
                    color: "bg-blue-500",
                    key: "MWF",
                  },
                  {
                    label: "T / T / S",
                    value: scheduleCounts.tts,
                    color: "bg-teal-500",
                    key: "TTS",
                  },
                ].map((s) => {
                  const total = scheduleCounts.mwf + scheduleCounts.tts;
                  const pct =
                    total > 0 ? Math.round((s.value / total) * 100) : 0;
                  return (
                    <div key={s.key}>
                      <div className="flex justify-between mb-1">
                        <button
                          type="button"
                          onClick={() =>
                            updateFilter(
                              "days",
                              filters.days === s.key ? "" : s.key,
                            )
                          }
                          className={`text-xs font-medium transition-colors hover:text-blue-600 ${filters.days === s.key ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300"}`}
                        >
                          {s.label}
                        </button>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {s.value} students
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${s.color}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm flex items-center gap-2">
                <Users size={15} className="text-purple-500" />
                Class Type
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    label: "Group",
                    value: typeCounts.group,
                    key: "GROUP",
                    color:
                      "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
                  },
                  {
                    label: "Personal",
                    value: typeCounts.personal,
                    key: "PERSONAL",
                    color:
                      "text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400",
                  },
                  {
                    label: "Online",
                    value: typeCounts.online,
                    key: "ONLINE",
                    color:
                      "text-teal-600 bg-teal-50 dark:bg-teal-900/20 dark:text-teal-400",
                  },
                ].map((t) => (
                  <button
                    type="button"
                    key={t.key}
                    onClick={() =>
                      updateFilter(
                        "classType",
                        filters.classType === t.key ? "" : t.key,
                      )
                    }
                    className={`rounded-xl p-2.5 text-center transition-all border-2 ${filters.classType === t.key ? `border-blue-500 ${t.color}` : `border-transparent ${t.color}`}`}
                  >
                    <p className="text-lg font-black">{t.value}</p>
                    <p className="text-xs font-medium mt-0.5">{t.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-2xl p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm flex items-center gap-2">
              <Clock size={15} className="text-amber-500" />
              Students per Time Slot
            </h3>
            <div className="space-y-3">
              {timeSlotCounts
                .filter((t) => t.count > 0)
                .sort((a, b) => b.count - a.count)
                .map((t) => {
                  const max = Math.max(...timeSlotCounts.map((x) => x.count));
                  const pct = max > 0 ? Math.round((t.count / max) * 100) : 0;
                  return (
                    <div key={t.slot}>
                      <div className="flex justify-between mb-1">
                        <button
                          type="button"
                          onClick={() =>
                            updateFilter(
                              "timeSlot",
                              filters.timeSlot === t.slot ? "" : t.slot,
                            )
                          }
                          className={`text-xs font-medium transition-colors hover:text-blue-600 ${filters.timeSlot === t.slot ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300"}`}
                        >
                          {t.label}
                        </button>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {t.count}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              {timeSlotCounts.every((t) => t.count === 0) && (
                <p className="text-xs text-gray-400 text-center py-2">
                  No active enrollment data
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${hasFilters ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"}`}
        >
          <Filter size={15} />
          Filters
          {hasFilters && (
            <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
              {
                [
                  filters.courseId,
                  filters.classType,
                  filters.timeSlot,
                  filters.days,
                  filters.labId,
                ].filter(Boolean).length
              }
            </span>
          )}
        </button>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-red-600 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-900"
          >
            <X size={13} />
            Clear Filters
          </button>
        )}
        <span className="text-sm text-gray-400 ml-auto">
          {classes.length} class{classes.length !== 1 ? "es" : ""}
        </span>
      </div>
      {showFilters && (
        <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-2xl p-5 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Course
              </span>
              <select
                value={filters.courseId}
                onChange={(e) => updateFilter("courseId", e.target.value)}
                className="h-9 w-full rounded-xl border dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Class Type
              </span>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: "", label: "All" },
                  { value: "GROUP", label: "Group" },
                  { value: "PERSONAL", label: "1:1" },
                  { value: "ONLINE", label: "Online" },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => updateFilter("classType", opt.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filters.classType === opt.value ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Schedule
              </span>
              <div className="flex gap-2">
                {[
                  { value: "", label: "All" },
                  { value: "MWF", label: "M/W/F" },
                  { value: "TTS", label: "T/T/S" },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => updateFilter("days", opt.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filters.days === opt.value ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Time Slot
              </span>
              <select
                value={filters.timeSlot}
                onChange={(e) => updateFilter("timeSlot", e.target.value)}
                className="h-9 w-full rounded-xl border dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Times</option>
                {Object.entries(TIME_SLOTS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
      {hasFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.courseId && (
            <span className="flex items-center gap-1.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-full font-medium">
              {courses.find((c) => c.id === filters.courseId)?.title}
              <button
                type="button"
                onClick={() => updateFilter("courseId", "")}
              >
                <X size={10} />
              </button>
            </span>
          )}
          {filters.classType && (
            <span className="flex items-center gap-1.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-full font-medium">
              {filters.classType}
              <button
                type="button"
                onClick={() => updateFilter("classType", "")}
              >
                <X size={10} />
              </button>
            </span>
          )}
          {filters.days && (
            <span className="flex items-center gap-1.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-full font-medium">
              {filters.days}
              <button type="button" onClick={() => updateFilter("days", "")}>
                <X size={10} />
              </button>
            </span>
          )}
          {filters.timeSlot && (
            <span className="flex items-center gap-1.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-full font-medium">
              {TIME_SLOTS[filters.timeSlot as keyof typeof TIME_SLOTS]}
              <button
                type="button"
                onClick={() => updateFilter("timeSlot", "")}
              >
                <X size={10} />
              </button>
            </span>
          )}
        </div>
      )}
      {classes.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-dashed dark:border-gray-700 rounded-2xl p-12 text-center">
          <BookOpen
            size={36}
            className="mx-auto mb-3 text-gray-300 dark:text-gray-600"
          />
          <p className="font-semibold text-gray-400 dark:text-gray-500">
            No classes match these filters
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {classes.map((c) => {
            const fillPct =
              c.capacity > 0
                ? Math.round((c._count.enrollments / c.capacity) * 100)
                : 0;
            const isFull = c._count.enrollments >= c.capacity;
            return (
              <Link
                key={c.id}
                href={`${detailHrefPrefix}/${c.id}${detailSuffix}`}
              >
                <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-2xl p-5 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                        {c.course.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {c.lab?.name ?? "Online"}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ml-2 ${c.status === "STARTED" ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" : c.status === "REGISTRATION" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-gray-100 text-gray-500 dark:bg-gray-700"}`}
                    >
                      {c.status === "REGISTRATION"
                        ? "📋"
                        : c.status === "STARTED"
                          ? "🚀"
                          : "🏁"}{" "}
                      {c.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <div className="flex items-center gap-4">
                      <span>
                        ⏰{" "}
                        {TIME_SLOTS[c.timeSlot as keyof typeof TIME_SLOTS] ??
                          c.timeSlot}
                      </span>
                      <span>
                        📅{" "}
                        {CLASS_DAYS[c.days as keyof typeof CLASS_DAYS] ??
                          c.days}
                      </span>
                    </div>
                    <span>
                      👤 {c.teacher.user.firstName} {c.teacher.user.lastName}
                    </span>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500 dark:text-gray-400">
                        {c._count.enrollments} / {c.capacity} students
                      </span>
                      <span
                        className={`font-semibold ${isFull ? "text-red-600" : fillPct >= 80 ? "text-amber-600" : "text-green-600"}`}
                      >
                        {isFull ? "Full" : `${fillPct}%`}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${isFull ? "bg-red-500" : fillPct >= 80 ? "bg-amber-500" : "bg-gradient-to-r from-green-400 to-teal-500"}`}
                        style={{ width: `${Math.min(100, fillPct)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

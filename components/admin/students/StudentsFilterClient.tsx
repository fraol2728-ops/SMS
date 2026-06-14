"use client";

import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Filter,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pagination } from "@/components/shared/Pagination";

interface CourseCount {
  id: string;
  title: string;
  studentCount: number;
}

interface CourseOption {
  id: string;
  title: string;
}

interface StudentListItem {
  id: string;
  userId: string;
  user: {
    firstName: string;
    lastName: string;
    phone?: string | null;
    gender?: string | null;
    profilePhoto?: string | null;
  };
  enrollments: {
    class?: { course?: { title?: string | null } | null } | null;
    paymentRemaining?: { remainingAmount: number; status: string } | null;
  }[];
}

interface StudentsFilterClientProps {
  students: StudentListItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  courses: CourseOption[];
  courseStudentCounts: CourseCount[];
  analytics: {
    total: number;
    male: number;
    female: number;
    withRemaining: number;
    fullyPaid: number;
  };
  currentFilters: {
    q: string;
    gender: string;
    courseId: string;
    classType: string;
    paymentStatus: string;
    hasRemaining: string;
    status: string;
  };
}

const PAGE_SIZE = 20;

export function StudentsFilterClient({
  students,
  totalCount,
  totalPages,
  currentPage,
  courses,
  courseStudentCounts,
  analytics,
  currentFilters,
}: StudentsFilterClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [showFilters, setShowFilters] = useState(
    !!(
      currentFilters.gender ||
      currentFilters.courseId ||
      currentFilters.classType ||
      currentFilters.hasRemaining
    ),
  );
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [filters, setFilters] = useState(currentFilters);

  function applyFilters(newFilters: typeof filters) {
    const params = new URLSearchParams();
    if (newFilters.q) params.set("q", newFilters.q);
    if (newFilters.gender) params.set("gender", newFilters.gender);
    if (newFilters.courseId) params.set("courseId", newFilters.courseId);
    if (newFilters.classType) params.set("classType", newFilters.classType);
    if (newFilters.hasRemaining)
      params.set("hasRemaining", newFilters.hasRemaining);
    if (newFilters.status && newFilters.status !== "ACTIVE")
      params.set("status", newFilters.status);
    params.set("page", "1");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function updateFilter(key: keyof typeof filters, value: string) {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  }

  function clearAllFilters() {
    const cleared = {
      q: "",
      gender: "",
      courseId: "",
      classType: "",
      paymentStatus: "",
      hasRemaining: "",
      status: "ACTIVE",
    };
    setFilters(cleared);
    applyFilters(cleared);
  }

  const hasActiveFilters =
    filters.gender ||
    filters.courseId ||
    filters.classType ||
    filters.hasRemaining;

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => setShowAnalytics((v) => !v)}
        className="flex items-center gap-2 text-sm font-semibold text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        <TrendingUp size={16} />
        Analytics Overview
        {showAnalytics ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {showAnalytics && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              {
                label: "Total Students",
                value: analytics.total,
                bg: "bg-blue-50 dark:bg-blue-900/20",
                text: "text-blue-700 dark:text-blue-400",
              },
              {
                label: "Male",
                value: analytics.male,
                bg: "bg-indigo-50 dark:bg-indigo-900/20",
                text: "text-indigo-700 dark:text-indigo-400",
              },
              {
                label: "Female",
                value: analytics.female,
                bg: "bg-pink-50 dark:bg-pink-900/20",
                text: "text-pink-700 dark:text-pink-400",
              },
              {
                label: "Has Remaining",
                value: analytics.withRemaining,
                bg: "bg-amber-50 dark:bg-amber-900/20",
                text: "text-amber-700 dark:text-amber-400",
              },
              {
                label: "Fully Paid",
                value: analytics.fullyPaid,
                bg: "bg-green-50 dark:bg-green-900/20",
                text: "text-green-700 dark:text-green-400",
              },
            ].map(({ label, value, bg, text }) => (
              <div key={label} className={`${bg} rounded-2xl p-4`}>
                <p className={`text-2xl font-black ${text}`}>{value}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {label}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-gray-900 dark:text-white">
              <BookOpen size={16} className="text-blue-500" />
              Students per Course
            </h3>
            <div className="space-y-3">
              {courseStudentCounts.map((course) => {
                const pct =
                  analytics.total > 0
                    ? Math.round((course.studentCount / analytics.total) * 100)
                    : 0;
                return (
                  <div key={course.id}>
                    <div className="mb-1 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() =>
                          updateFilter(
                            "courseId",
                            filters.courseId === course.id ? "" : course.id,
                          )
                        }
                        className={`text-sm font-medium transition-colors hover:text-blue-600 ${filters.courseId === course.id ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}
                      >
                        {course.title}
                        {filters.courseId === course.id && (
                          <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
                            filtered
                          </span>
                        )}
                      </button>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {course.studentCount}{" "}
                        <span className="font-normal text-gray-400 text-xs">
                          ({pct}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {courseStudentCounts.length === 0 && (
                <p className="text-gray-400 text-sm">No courses found</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          onKeyDown={(e) => e.key === "Enter" && applyFilters(filters)}
          placeholder="Search by name, phone, or student code..."
          className="h-11 flex-1 rounded-2xl border bg-white px-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
        />
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={`flex h-11 items-center gap-2 rounded-2xl border px-4 font-medium text-sm transition-all ${hasActiveFilters ? "border-blue-600 bg-blue-600 text-white" : "border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"}`}
        >
          <Filter size={15} /> Filters
          {hasActiveFilters && (
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
              {
                [
                  filters.gender,
                  filters.courseId,
                  filters.classType,
                  filters.hasRemaining,
                ].filter(Boolean).length
              }
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="flex h-11 items-center gap-1.5 rounded-2xl border border-red-200 px-4 font-medium text-red-600 text-sm transition-colors hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>

      {showFilters && (
        <div className="rounded-2xl border bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FilterButtonGroup
              label="Gender"
              options={[
                { value: "", label: "All" },
                { value: "MALE", label: "👨 Male" },
                { value: "FEMALE", label: "👩 Female" },
              ]}
              value={filters.gender}
              onChange={(value) => updateFilter("gender", value)}
            />
            <div className="space-y-1.5">
              <span className="font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
                Course
              </span>
              <select
                value={filters.courseId}
                onChange={(e) => updateFilter("courseId", e.target.value)}
                className="h-9 w-full rounded-xl border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="">All Courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <FilterButtonGroup
              label="Class Type"
              options={[
                { value: "", label: "All" },
                { value: "GROUP", label: "Group" },
                { value: "PERSONAL", label: "Personal" },
                { value: "ONLINE", label: "Online" },
              ]}
              value={filters.classType}
              onChange={(value) => updateFilter("classType", value)}
            />
            <FilterButtonGroup
              label="Payment Status"
              options={[
                { value: "", label: "All" },
                { value: "yes", label: "⚠️ Has Remaining" },
                { value: "no", label: "✅ Fully Paid" },
              ]}
              value={filters.hasRemaining}
              onChange={(value) => updateFilter("hasRemaining", value)}
            />
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <ActiveFilters
          filters={filters}
          courses={courses}
          totalCount={totalCount}
          updateFilter={updateFilter}
        />
      )}

      <div className="overflow-hidden rounded-3xl border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        {isPending && <div className="h-1 animate-pulse bg-blue-500" />}
        {students.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-semibold">No students match these filters</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-3 font-medium text-blue-600 text-sm hover:text-blue-800"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y dark:divide-gray-700/50">
            {students.map((s) => {
              const enrollment = s.enrollments[0];
              const course = enrollment?.class?.course?.title;
              const hasRem = (s.enrollments ?? []).some(
                (e) =>
                  (e.paymentRemaining?.remainingAmount ?? 0) > 0 &&
                  e.paymentRemaining?.status !== "PAID",
              );
              return (
                <Link
                  key={s.id}
                  href={`/admin/students/${s.userId}`}
                  className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  {s.user.profilePhoto ? (
                    <Image
                      src={s.user.profilePhoto}
                      alt=""
                      width={44}
                      height={44}
                      className="h-11 w-11 flex-shrink-0 rounded-2xl object-cover shadow-sm"
                    />
                  ) : (
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
                      {s.user.firstName[0]}
                      {s.user.lastName[0]}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white">
                        {s.user.firstName} {s.user.lastName}
                      </p>
                      {s.user.gender && (
                        <span className="text-gray-400 text-xs">
                          {s.user.gender === "MALE"
                            ? "👨"
                            : s.user.gender === "FEMALE"
                              ? "👩"
                              : ""}
                        </span>
                      )}
                      {hasRem && (
                        <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-amber-700 text-xs dark:bg-amber-900/30 dark:text-amber-400">
                          ⚠️ Remaining
                        </span>
                      )}
                    </div>
                    <p className="truncate text-gray-400 text-sm">
                      {course ?? "No class assigned"}
                    </p>
                  </div>
                  <p className="hidden flex-shrink-0 text-gray-500 text-sm dark:text-gray-400 sm:block">
                    {s.user.phone ?? "—"}
                  </p>
                  <span className="flex-shrink-0 text-gray-300 transition-colors group-hover:text-blue-500 dark:text-gray-600">
                    ›
                  </span>
                </Link>
              );
            })}
          </div>
        )}
        {totalPages > 1 && (
          <div className="border-t px-6 py-4 dark:border-gray-700">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              itemsPerPage={PAGE_SIZE}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function FilterButtonGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <span className="font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-xl px-3 py-1.5 font-medium text-xs transition-all ${value === opt.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ActiveFilters({
  filters,
  courses,
  totalCount,
  updateFilter,
}: {
  filters: StudentsFilterClientProps["currentFilters"];
  courses: CourseOption[];
  totalCount: number;
  updateFilter: (
    key: keyof StudentsFilterClientProps["currentFilters"],
    value: string,
  ) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.gender && (
        <FilterChip
          label={`Gender: ${filters.gender}`}
          onClear={() => updateFilter("gender", "")}
        />
      )}
      {filters.courseId && (
        <FilterChip
          label={`Course: ${courses.find((c) => c.id === filters.courseId)?.title ?? "—"}`}
          onClear={() => updateFilter("courseId", "")}
        />
      )}
      {filters.classType && (
        <FilterChip
          label={`Type: ${filters.classType}`}
          onClear={() => updateFilter("classType", "")}
        />
      )}
      {filters.hasRemaining && (
        <FilterChip
          label={
            filters.hasRemaining === "yes" ? "Has Remaining" : "Fully Paid"
          }
          onClear={() => updateFilter("hasRemaining", "")}
          accent="amber"
        />
      )}
      <span className="flex items-center text-gray-400 text-xs">
        — {totalCount} result{totalCount !== 1 ? "s" : ""}
      </span>
    </div>
  );
}

function FilterChip({
  label,
  onClear,
  accent = "blue",
}: {
  label: string;
  onClear: () => void;
  accent?: "blue" | "amber";
}) {
  const classes =
    accent === "amber"
      ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      : "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  return (
    <span
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium text-xs ${classes}`}
    >
      {label}
      <button type="button" onClick={onClear}>
        <X size={10} />
      </button>
    </span>
  );
}

"use client";

import { Check, Clock, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { submitAttendance } from "@/lib/actions/teacher";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

type StudentEnrollment = {
  id: string;
  student: {
    studentCode: string;
    user: {
      firstName: string;
      lastName: string;
      phone?: string | null;
    };
  };
};

type ExistingAttendance = {
  enrollmentId: string;
  status: AttendanceStatus;
};

type HistoryGroup = {
  date: Date | string;
  class: {
    course: { title: string };
    lab: { name: string } | null;
  } | null;
  presentCount: number;
  absentCount: number;
};

export function AttendanceMarker({
  classes,
  selectedClassId,
  selectedDate,
  students,
  existingAttendance,
  historyGroups,
}: {
  classes: { id: string; label: string; timeSlot: string; days: string }[];
  selectedClassId: string;
  selectedDate: string;
  students: StudentEnrollment[];
  existingAttendance: ExistingAttendance[];
  historyGroups: HistoryGroup[];
}) {
  const router = useRouter();
  const [classId, setClassId] = useState(selectedClassId);
  const [date, setDate] = useState(selectedDate);
  const [attendance, setAttendance] = useState<
    Record<string, AttendanceStatus>
  >({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setClassId(selectedClassId);
    setDate(selectedDate);
  }, [selectedClassId, selectedDate]);

  useEffect(() => {
    const initial: Record<string, AttendanceStatus> = {};
    students.forEach((e) => {
      const existing = existingAttendance.find((a) => a.enrollmentId === e.id);
      initial[e.id] = existing?.status ?? "PRESENT";
    });
    setAttendance(initial);
    setSaved(existingAttendance.length > 0);
  }, [students, existingAttendance]);

  function updateClass(newClassId: string) {
    setClassId(newClassId);
    router.push(`/teacher/attendance?classId=${newClassId}&date=${date}`);
  }

  function updateDate(newDate: string) {
    setDate(newDate);
    router.push(`/teacher/attendance?classId=${classId}&date=${newDate}`);
  }

  function setStatus(enrollmentId: string, status: AttendanceStatus) {
    setAttendance((prev) => ({ ...prev, [enrollmentId]: status }));
    setSaved(false);
  }

  async function handleSubmit() {
    if (students.length === 0) {
      toast.error("No students in this class");
      return;
    }
    setLoading(true);
    try {
      const records = Object.entries(attendance).map(
        ([enrollmentId, status]) => ({
          enrollmentId,
          status,
          classId,
          date,
        }),
      );
      const res = await submitAttendance(records);
      if (res.success) {
        toast.success("Attendance saved successfully");
        setSaved(true);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  const presentCount = Object.values(attendance).filter(
    (s) => s === "PRESENT",
  ).length;
  const absentCount = Object.values(attendance).filter(
    (s) => s === "ABSENT",
  ).length;
  const lateCount = Object.values(attendance).filter(
    (s) => s === "LATE",
  ).length;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-4 sm:p-5 dark:border-gray-700 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="teacher-attendance-class"
              className="font-medium text-gray-700 text-sm dark:text-gray-300"
            >
              Select Class
            </label>
            <select
              id="teacher-attendance-class"
              value={classId}
              onChange={(e) => updateClass(e.target.value)}
              className="h-10 w-full rounded-lg border bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select a class...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="teacher-attendance-date"
              className="font-medium text-gray-700 text-sm dark:text-gray-300"
            >
              Date
            </label>
            <input
              id="teacher-attendance-date"
              type="date"
              value={date}
              onChange={(e) => updateDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="h-10 w-full rounded-lg border bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      {classId && students.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-green-100 bg-green-50 p-3 sm:p-4 text-center dark:border-green-900/50 dark:bg-green-900/20">
              <p className="font-bold text-2xl text-green-700">
                {presentCount}
              </p>
              <p className="mt-0.5 text-green-600 text-xs">Present</p>
            </div>
            <div className="rounded-xl border border-red-100 bg-red-50 p-3 sm:p-4 text-center dark:border-red-900/50 dark:bg-red-900/20">
              <p className="font-bold text-2xl text-red-700">{absentCount}</p>
              <p className="mt-0.5 text-red-600 text-xs">Absent</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 sm:p-4 text-center dark:border-amber-900/50 dark:bg-amber-900/20">
              <p className="font-bold text-2xl text-amber-700">{lateCount}</p>
              <p className="mt-0.5 text-amber-600 text-xs">Late</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border bg-white dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-4 sm:px-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {students.length} Students
              </h2>
              {saved && (
                <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-green-600 text-xs">
                  ✓ Attendance saved
                </span>
              )}
            </div>

            <div className="divide-y dark:divide-gray-700">
              {students.map((enrollment, index) => {
                const user = enrollment.student.user;
                const status = attendance[enrollment.id] ?? "PRESENT";

                return (
                  <div
                    key={enrollment.id}
                    className={`flex flex-col gap-3 px-4 py-4 transition-colors sm:flex-row sm:items-center sm:justify-between sm:px-6 ${
                      status === "ABSENT"
                        ? "bg-red-50/50"
                        : status === "LATE"
                          ? "bg-amber-50/50"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                      <span className="w-6 text-right text-gray-400 text-sm">
                        {index + 1}
                      </span>
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full font-bold text-sm ${
                          status === "ABSENT"
                            ? "bg-red-100 text-red-700"
                            : status === "LATE"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {enrollment.student.studentCode}
                        </p>
                      </div>
                    </div>

                    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                      <button
                        type="button"
                        onClick={() => setStatus(enrollment.id, "PRESENT")}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-xs transition-all ${
                          status === "PRESENT"
                            ? "bg-green-500 text-white shadow-sm"
                            : "bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-700"
                        }`}
                      >
                        <Check size={12} />
                        Present
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus(enrollment.id, "LATE")}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-xs transition-all ${
                          status === "LATE"
                            ? "bg-amber-500 text-white shadow-sm"
                            : "bg-gray-100 text-gray-500 hover:bg-amber-50 hover:text-amber-700"
                        }`}
                      >
                        <Clock size={12} />
                        Late
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus(enrollment.id, "ABSENT")}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-xs transition-all ${
                          status === "ABSENT"
                            ? "bg-red-500 text-white shadow-sm"
                            : "bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-700"
                        }`}
                      >
                        <X size={12} />
                        Absent
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t bg-gray-50 px-4 py-4 sm:px-6 dark:border-gray-700 dark:bg-gray-800">
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  "Saving..."
                ) : (
                  <>
                    <Save size={16} />
                    {saved ? "Update Attendance" : "Save Attendance"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}

      {classId && students.length === 0 && (
        <div className="rounded-xl border bg-white dark:border-gray-700 dark:bg-gray-900 p-12 text-center">
          <p className="text-gray-400">
            No students enrolled in this class yet.
          </p>
        </div>
      )}

      {historyGroups.length > 0 && (
        <div className="rounded-xl border bg-white dark:border-gray-700 dark:bg-gray-900 p-6">
          <h2 className="mb-5 font-semibold text-gray-900 dark:text-white">
            Recent History
          </h2>
          <div className="space-y-3">
            {historyGroups.slice(0, 10).map((group, index) => (
              <div
                key={`${group.date}-${index}`}
                className="flex flex-col gap-3 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:bg-gray-800"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {group.class?.course.title}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {group.class?.lab?.name ?? "Online"} •{" "}
                    {new Date(group.date).toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-green-50 px-2 py-1 text-green-700 text-xs">
                    {group.presentCount} present
                  </span>
                  {group.absentCount > 0 && (
                    <span className="rounded-full bg-red-50 px-2 py-1 text-red-700 text-xs">
                      {group.absentCount} absent
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { RefreshCw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { changeStudentClass } from "@/lib/actions/admin";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";

type AvailableClass = {
  id: string;
  course: { title: string };
  lab: { name: string } | null;
  timeSlot: string;
  days: string;
  capacity: number;
  _count?: { enrollments: number };
};

export function ChangeClassButton({
  enrollmentId,
  availableClasses,
  currentClassId,
}: {
  enrollmentId: string;
  availableClasses: AvailableClass[];
  currentClassId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [loading, setLoading] = useState(false);

  const filteredClasses = availableClasses.filter(
    (c) => c.id !== currentClassId,
  );

  async function handleChange() {
    if (!selectedClassId) {
      toast.error("Please select a class");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("enrollmentId", enrollmentId);
      formData.set("newClassId", selectedClassId);
      const res = await changeStudentClass(formData);
      if (res.success) {
        toast.success("Class changed successfully");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-white/30"
        type="button"
      >
        <RefreshCw size={13} />
        Change Class
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            aria-label="Close change class modal"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative mx-4 max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-black text-gray-900 text-lg dark:text-white">
                Change Class
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                type="button"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mb-4 text-gray-500 text-sm dark:text-gray-400">
              Select the new class for this student:
            </p>

            {filteredClasses.length === 0 ? (
              <p className="py-6 text-center text-gray-400">
                No other available classes
              </p>
            ) : (
              <div className="mb-5 space-y-2">
                {filteredClasses.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedClassId(c.id)}
                    className={`flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
                      selectedClassId === c.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <div
                      className={`mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2 ${
                        selectedClassId === c.id
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300 dark:border-gray-500"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm dark:text-white">
                        {c.course.title}
                      </p>
                      <p className="mt-0.5 text-gray-400 text-xs">
                        {c.lab?.name ?? "Online"} •{" "}
                        {TIME_SLOTS[c.timeSlot as keyof typeof TIME_SLOTS] ??
                          c.timeSlot}{" "}
                        •{" "}
                        {CLASS_DAYS[c.days as keyof typeof CLASS_DAYS] ??
                          c.days}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {c._count?.enrollments ?? 0} / {c.capacity} students
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleChange}
                disabled={loading || !selectedClassId}
                className="flex-1 rounded-2xl bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                type="button"
              >
                {loading ? "Changing..." : "Confirm Change"}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-2xl bg-gray-100 px-5 py-3 font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

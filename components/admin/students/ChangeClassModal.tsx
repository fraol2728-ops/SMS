"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { changeStudentClass } from "@/lib/actions/admin";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";

type ClassOption = {
  id: string;
  lab: { name: string } | null;
  timeSlot: string;
  days: string;
  course: { title: string };
  teacher: { user: { firstName: string; lastName: string } };
  capacity: number;
  _count: { enrollments: number };
};

export function ChangeClassModal({
  enrollmentId,
  currentClassId,
  studentName,
  availableClasses,
}: {
  enrollmentId: string;
  currentClassId: string;
  studentName: string;
  availableClasses: ClassOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClassId) {
      toast.error("Please select a class");
      return;
    }
    setLoading(true);
    try {
      const res = await changeStudentClass(enrollmentId, selectedClassId);
      if (res.success) {
        toast.success("Student moved to new class successfully");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Change Class
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold">Change Class</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Moving: <strong>{studentName}</strong>
          <br />
          All enrollment, payment, and attendance data will move to the new
          class.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Select New Class</Label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              required
            >
              <option value="">Choose a class...</option>
              {availableClasses
                .filter((c) => c.id !== currentClassId)
                .map((c) => {
                  const spots = c.capacity - c._count.enrollments;
                  const time =
                    TIME_SLOTS[c.timeSlot as keyof typeof TIME_SLOTS];
                  const days = CLASS_DAYS[c.days as keyof typeof CLASS_DAYS];
                  return (
                    <option key={c.id} value={c.id} disabled={spots <= 0}>
                      {c.lab?.name ?? "Online"} • {c.course.title} • {time} •{" "}
                      {days}
                      {spots <= 0 ? " — FULL" : ` — ${spots} spots`}
                    </option>
                  );
                })}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Moving..." : "Confirm Move"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

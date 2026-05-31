"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { assignWithdrawnStudent } from "@/lib/actions/admin";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";
export function AssignClassForm({
  enrollmentId,
  availableClasses,
}: {
  enrollmentId: string;
  availableClasses: any[];
}) {
  const router = useRouter();
  const [classId, setClassId] = useState("");
  const [loading, setLoading] = useState(false);
  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!classId) {
      toast.error("Please select a class");
      return;
    }
    setLoading(true);
    try {
      const res = await assignWithdrawnStudent(enrollmentId, classId);
      if (res.success) {
        toast.success("Student assigned to class successfully");
        router.push("/admin/withdrawn");
      } else toast.error(res.error);
    } finally {
      setLoading(false);
    }
  }
  return (
    <form onSubmit={handleAssign} className="space-y-4">
      <div className="space-y-2">
        <Label>Select Class *</Label>
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          required
        >
          <option value="">Choose available class...</option>
          {availableClasses.map((c) => {
            const spots = c.capacity - c._count.enrollments;
            const time = TIME_SLOTS[c.timeSlot as keyof typeof TIME_SLOTS];
            const days = CLASS_DAYS[c.days as keyof typeof CLASS_DAYS];
            return (
              <option key={c.id} value={c.id} disabled={spots <= 0}>
                {c.lab?.name ?? "Online"} • {c.course.title} • {time} • {days}
                {spots <= 0 ? " — FULL" : ` — ${spots} spots left`}
              </option>
            );
          })}
        </select>
      </div>
      <Button type="submit" disabled={loading || !classId}>
        {loading ? "Assigning..." : "Assign to Class"}
      </Button>
    </form>
  );
}

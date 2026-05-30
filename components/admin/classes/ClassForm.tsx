"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createClass } from "@/lib/actions/admin";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";

type Course = { id: string; title: string };
type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  teacherProfile: { id: string } | null;
};
type Lab = { id: string; name: string };

export function ClassForm({
  courses,
  teachers,
  labs,
}: {
  courses: Course[];
  teachers: Teacher[];
  labs: Lab[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await createClass(formData);
      if (res.success) {
        toast.success("Class created successfully");
        router.push("/admin/classes");
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="courseId">Course *</Label>
          <select
            id="courseId"
            name="courseId"
            required
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Select course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="teacherId">Teacher *</Label>
          <select
            id="teacherId"
            name="teacherId"
            required
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Select teacher</option>
            {teachers
              .filter((teacher) => teacher.teacherProfile)
              .map((teacher) => (
                <option
                  key={teacher.teacherProfile?.id}
                  value={teacher.teacherProfile?.id}
                >
                  {teacher.firstName} {teacher.lastName}
                </option>
              ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="labId">Lab *</Label>
          <select
            id="labId"
            name="labId"
            required
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Select lab</option>
            {labs.map((lab) => (
              <option key={lab.id} value={lab.id}>
                {lab.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeSlot">Time Slot *</Label>
          <select
            id="timeSlot"
            name="timeSlot"
            required
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Select time</option>
            {Object.entries(TIME_SLOTS).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="days">Days *</Label>
          <select
            id="days"
            name="days"
            required
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Select days</option>
            {Object.entries(CLASS_DAYS).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="capacity">Max Capacity</Label>
          <input
            id="capacity"
            name="capacity"
            type="number"
            defaultValue={20}
            min={1}
            max={30}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          />
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Class"}
      </Button>
    </form>
  );
}

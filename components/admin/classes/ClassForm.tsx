"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createClass, updateClass } from "@/lib/actions/admin";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";

type Course = { id: string; title: string };
type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  teacherProfile: { id: string } | null;
};
type Lab = { id: string; name: string };

type DefaultClassValues = {
  id?: string;
  courseId?: string;
  teacherId?: string;
  labId?: string;
  timeSlot?: string;
  days?: string;
  capacity?: number;
};

export function ClassForm({
  courses,
  teachers,
  labs,
  defaultValues,
}: {
  courses: Course[];
  teachers: Teacher[];
  labs: Lab[];
  defaultValues?: DefaultClassValues;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(defaultValues?.id);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const res = isEdit && defaultValues?.id
        ? await updateClass(defaultValues.id, formData)
        : await createClass(formData);
      if (res.success) {
        toast.success(
          isEdit ? "Class updated successfully" : "Class created successfully",
        );
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
            defaultValue={defaultValues?.courseId ?? ""}
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
            defaultValue={defaultValues?.teacherId ?? ""}
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
            defaultValue={defaultValues?.labId ?? ""}
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
            defaultValue={defaultValues?.timeSlot ?? ""}
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
            defaultValue={defaultValues?.days ?? ""}
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
            defaultValue={defaultValues?.capacity ?? 20}
            min={1}
            max={30}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          />
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? (isEdit ? "Saving..." : "Creating...") : isEdit ? "Save Changes" : "Create Class"}
      </Button>
    </form>
  );
}

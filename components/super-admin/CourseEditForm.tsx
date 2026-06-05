"use client";

import type { Course } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCoursePrice } from "@/lib/actions/super-admin";

export function CourseEditForm({
  course,
  campusId,
}: {
  course: Course;
  campusId?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const coursesHref = campusId
    ? `/super-admin/courses?campusId=${campusId}`
    : "/super-admin/courses";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(event.currentTarget);
      const response = await updateCoursePrice(course.id, formData);
      if (response.success) {
        toast.success("Course updated successfully");
        router.push(coursesHref);
      } else {
        toast.error(response.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
    >
      <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
        <p className="font-medium text-amber-700 text-xs dark:text-amber-400">
          🔒 Super Admin Only — Course pricing
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Course Title</Label>
        <Input
          value={course.title}
          readOnly
          className="cursor-not-allowed bg-gray-50 dark:bg-gray-800"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="fee">Course Price (ETB) *</Label>
        <Input
          id="fee"
          name="fee"
          type="number"
          min={0}
          required
          defaultValue={course.fee}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="durationWeeks">Duration (weeks)</Label>
        <select
          id="durationWeeks"
          name="durationWeeks"
          defaultValue={course.durationWeeks}
          className="h-10 w-full rounded-lg border bg-background px-3 text-sm dark:border-gray-600 dark:bg-gray-800"
        >
          {[2, 4, 5, 6, 7, 8, 10, 12, 16, 24].map((weeks) => (
            <option key={weeks} value={weeks}>
              {weeks} weeks
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between rounded-xl border p-3 dark:border-gray-700">
        <Label>Active</Label>
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={course.isActive}
          className="h-4 w-4 accent-blue-600"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(coursesHref)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

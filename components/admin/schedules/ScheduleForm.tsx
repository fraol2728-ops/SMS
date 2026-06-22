"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createSchedule } from "@/lib/actions/admin";

type ScheduleCourse = {
  id: string;
  title: string;
};

type ScheduleTeacher = {
  id: string;
  user: {
    firstName: string | null;
    lastName: string | null;
  };
};

export function ScheduleForm({
  courses,
  teachers,
}: {
  courses: ScheduleCourse[];
  teachers: ScheduleTeacher[];
}) {
  const r = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(fd: FormData) {
    setIsSubmitting(true);
    try {
      const res = await createSchedule(fd);
      if (res.success) r.push("/admin/schedules");
      else toast.error(res.error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const days = [
    { v: 1, n: "Monday" },
    { v: 2, n: "Tuesday" },
    { v: 3, n: "Wednesday" },
    { v: 4, n: "Thursday" },
    { v: 5, n: "Friday" },
    { v: 6, n: "Saturday" },
    { v: 0, n: "Sunday" },
  ];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(new FormData(e.currentTarget));
      }}
      className="space-y-3 max-w-xl"
    >
      <select name="courseId" required className="h-10 rounded-md border px-3">
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </select>
      <select name="teacherId" required className="h-10 rounded-md border px-3">
        {teachers.map((t) => (
          <option key={t.id} value={t.id}>
            {t.user.firstName} {t.user.lastName}
          </option>
        ))}
      </select>
      <select name="dayOfWeek" required className="h-10 rounded-md border px-3">
        {days.map((d) => (
          <option key={d.v} value={d.v}>
            {d.n}
          </option>
        ))}
      </select>
      <input
        type="time"
        name="startTime"
        required
        className="h-10 rounded-md border px-3"
      />
      <input
        type="time"
        name="endTime"
        required
        className="h-10 rounded-md border px-3"
      />
      <input
        name="room"
        placeholder="Room"
        className="h-10 rounded-md border px-3"
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Create schedule"}
      </Button>
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createClass, updateClass } from "@/lib/actions/admin";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";

type Course = { id: string; title: string; durationWeeks: number };
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
  classType?: "GROUP" | "PERSONAL" | "ONLINE";
  onlineLink?: string;
  startDate?: string;
  endDate?: string;
  capacity?: number;
  status?: "REGISTRATION" | "STARTED" | "ENDED";
};

function calculateEndDate(startValue: string, course?: Course) {
  if (!startValue || !course) return "";
  const start = new Date(startValue);
  const end = new Date(start);
  end.setDate(end.getDate() + course.durationWeeks * 7);
  return end.toISOString().slice(0, 10);
}

export function ClassForm({
  courses,
  teachers,
  labs,
  defaultValues,
  redirectBasePath = "/admin/classes",
}: {
  courses: Course[];
  teachers: Teacher[];
  labs: Lab[];
  defaultValues?: DefaultClassValues;
  redirectBasePath?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(
    defaultValues?.courseId ?? "",
  );
  const [endDate, setEndDate] = useState(defaultValues?.endDate ?? "");
  const [classType, setClassType] = useState(
    defaultValues?.classType ?? "GROUP",
  );
  const isEdit = Boolean(defaultValues?.id);

  function recalculateEndDate(courseId: string) {
    const startInput = document.getElementById("startDate") as HTMLInputElement;
    setEndDate(
      calculateEndDate(
        startInput?.value ?? "",
        courses.find((course) => course.id === courseId),
      ),
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const res =
        isEdit && defaultValues?.id
          ? await updateClass(defaultValues.id, formData)
          : await createClass(formData);
      if (res.success) {
        toast.success(
          isEdit ? "Class updated successfully" : "Class created successfully",
        );
        router.push(redirectBasePath);
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
            value={selectedCourseId}
            onChange={(event) => {
              setSelectedCourseId(event.target.value);
              recalculateEndDate(event.target.value);
            }}
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
          <Label htmlFor="classType">Class Type *</Label>
          <select
            id="classType"
            name="classType"
            required
            value={classType}
            onChange={(event) =>
              setClassType(
                event.target.value as "GROUP" | "PERSONAL" | "ONLINE",
              )
            }
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="GROUP">Group Class</option>
            <option value="PERSONAL">Personal Class</option>
            <option value="ONLINE">Online Class</option>
          </select>
        </div>

        {classType === "ONLINE" ? (
          <div className="space-y-2">
            <Label htmlFor="onlineLink">Meeting Link (optional)</Label>
            <input
              id="onlineLink"
              name="onlineLink"
              placeholder="https://zoom.us/j/..."
              defaultValue={defaultValues?.onlineLink ?? ""}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>
        ) : (
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
        )}

        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date *</Label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            defaultValue={defaultValues?.startDate ?? ""}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            onChange={(event) => {
              setEndDate(
                calculateEndDate(
                  event.target.value,
                  courses.find((course) => course.id === selectedCourseId),
                ),
              );
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date (auto-calculated)</Label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            readOnly
            value={endDate}
            className="h-10 w-full cursor-not-allowed rounded-md border bg-gray-50 px-3 text-sm"
          />
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

        <div className="space-y-2">
          <Label htmlFor="status">Class Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={defaultValues?.status ?? "REGISTRATION"}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="REGISTRATION">Registration (Not started)</option>
            <option value="STARTED">Started (In progress)</option>
            <option value="ENDED">Ended (Completed)</option>
          </select>
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading
          ? isEdit
            ? "Saving..."
            : "Creating..."
          : isEdit
            ? "Save Changes"
            : "Create Class"}
      </Button>
    </form>
  );
}

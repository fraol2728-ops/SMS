"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createStudent, updateStudent } from "@/lib/actions/admin";

type StudentFormCourse = {
  id: string;
  title: string;
  fee: number;
};

type StudentFormDefaultValues = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  gender?: string | null;
  dateOfBirth?: string | Date | null;
  address?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  emergencyContact?: string | null;
  notes?: string | null;
};

export function StudentForm({
  courses,
  defaultValues,
}: {
  courses: StudentFormCourse[];
  defaultValues?: StudentFormDefaultValues;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [courseId, setCourseId] = useState("");
  const isEdit = !!defaultValues;

  async function onSubmit(formData: FormData) {
    setLoading(true);

    if (!isEdit) {
      formData.set("courseId", courseId);
    }

    const result = isEdit
      ? await updateStudent(defaultValues.id, formData)
      : await createStudent(formData);

    setLoading(false);

    if (!result.success) {
      toast.error(result.error || "Failed to register student");
      return;
    }

    router.push("/admin/students");
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Personal info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Input
            name="firstName"
            placeholder="First name*"
            defaultValue={defaultValues?.firstName}
          />
          <Input
            name="lastName"
            placeholder="Last name*"
            defaultValue={defaultValues?.lastName}
          />
          <Input
            name="email"
            placeholder="Email*"
            defaultValue={defaultValues?.email}
          />
          <Input
            name="phone"
            placeholder="Phone"
            defaultValue={defaultValues?.phone}
          />
          <select
            name="gender"
            defaultValue={defaultValues?.gender ?? ""}
            className="h-10 rounded-md border px-3"
          >
            <option value="">Gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
          <Input
            name="dateOfBirth"
            type="date"
            defaultValue={
              defaultValues?.dateOfBirth instanceof Date
                ? defaultValues.dateOfBirth.toISOString().slice(0, 10)
                : defaultValues?.dateOfBirth?.slice(0, 10)
            }
          />
          <Textarea
            name="address"
            placeholder="Address"
            defaultValue={defaultValues?.address}
            className="md:col-span-2"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guardian info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Input
            name="guardianName"
            placeholder="Guardian name"
            defaultValue={defaultValues?.guardianName}
          />
          <Input
            name="guardianPhone"
            placeholder="Guardian phone"
            defaultValue={defaultValues?.guardianPhone}
          />
          <Input
            name="emergencyContact"
            placeholder="Emergency contact"
            className="md:col-span-2"
            defaultValue={defaultValues?.emergencyContact}
          />
        </CardContent>
      </Card>

      {!isEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Enrollment</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <select
              name="courseId"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              required
              className="h-10 rounded-md border px-3"
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title} - ETB {course.fee}
                </option>
              ))}
            </select>
            <Input type="date" name="startDate" />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea name="notes" defaultValue={defaultValues?.notes} />
        </CardContent>
      </Card>

      <Button type="submit" disabled={loading}>
        {loading
          ? isEdit
            ? "Updating..."
            : "Registering..."
          : isEdit
            ? "Update student"
            : "Register student"}
      </Button>
    </form>
  );
}

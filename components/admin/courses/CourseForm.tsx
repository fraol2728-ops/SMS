"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { createCourse, updateCourse } from "@/lib/actions/admin";

type CourseDefaults = {
  id: string;
  title?: string | null;
  fee?: number | null;
  durationWeeks?: number | null;
  isActive?: boolean | null;
};

export function CourseForm({
  defaultValues,
}: {
  defaultValues?: CourseDefaults;
}) {
  const router = useRouter();
  const isEdit = Boolean(defaultValues);
  const [isActive, setIsActive] = useState(defaultValues?.isActive ?? true);
  const [loading, setLoading] = useState(false);

  async function submit(formData: FormData) {
    setLoading(true);
    formData.set("isActive", String(isActive));
    const values = Object.fromEntries(formData.entries());
    const res =
      isEdit && defaultValues
        ? await updateCourse(defaultValues.id, formData)
        : await createCourse({
            title: values.title,
            fee: Number(values.fee),
            durationWeeks: Number(values.durationWeeks),
            isActive,
          });
    setLoading(false);

    if (res.success) {
      router.push("/admin/courses");
      return;
    }

    toast.error(res.error);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(new FormData(e.currentTarget));
      }}
      className="max-w-xl space-y-5"
    >
      <div className="space-y-2">
        <Label htmlFor="title">Course Name</Label>
        <Input
          id="title"
          name="title"
          required
          type="text"
          defaultValue={defaultValues?.title ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="fee">Course Fee (ETB)</Label>
        <Input
          id="fee"
          name="fee"
          required
          type="number"
          min={0}
          step="0.01"
          defaultValue={defaultValues?.fee ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="durationWeeks">Duration *</Label>
        <select
          id="durationWeeks"
          name="durationWeeks"
          required
          defaultValue={defaultValues?.durationWeeks ?? "8"}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
        >
          {[2, 4, 5, 6, 7, 8, 10, 12, 16, 24].map((weeks) => (
            <option key={weeks} value={weeks}>
              {weeks} weeks
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-3 rounded-md border p-4">
        <Switch
          id="isActive"
          checked={isActive}
          onCheckedChange={setIsActive}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? <Spinner className="mr-2" /> : null}
        Add Course
      </Button>
    </form>
  );
}

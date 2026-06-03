"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createTeacher,
  markWaitlistJoined,
  updateTeacher,
} from "@/lib/actions/admin";

type DefaultTeacherValues = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  gender?: string;
  specialty?: string;
  specialties?: string[];
  bio?: string;
  waitlistId?: string;
};

export function TeacherForm({
  defaultValues,
  redirectBasePath = "/admin/teachers",
}: {
  defaultValues?: DefaultTeacherValues;
  redirectBasePath?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [specialties, setSpecialties] = useState<string[]>(
    defaultValues?.specialties ??
      (defaultValues?.specialty ? [defaultValues.specialty] : []),
  );
  const [specialtyInput, setSpecialtyInput] = useState("");
  const isEdit = Boolean(defaultValues?.id);

  function addSpecialty() {
    const value = specialtyInput.trim();
    if (value && !specialties.includes(value)) {
      setSpecialties([...specialties, value]);
      setSpecialtyInput("");
    }
  }

  async function onSubmit(formData: FormData) {
    setLoading(true);
    try {
      if (isEdit && defaultValues?.id) {
        const res = await updateTeacher(defaultValues.id, formData);
        if (res.success) {
          toast.success("Teacher updated successfully");
          router.push(`${redirectBasePath}/${defaultValues.id}`);
        } else {
          toast.error(res.error);
        }
      } else {
        const res = await createTeacher(formData);
        if (res.success) {
          if (defaultValues?.waitlistId)
            await markWaitlistJoined(defaultValues.waitlistId);
          toast.success("Teacher added successfully");
          router.push(redirectBasePath);
        } else {
          toast.error(res.error);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}
      className="max-w-2xl space-y-6"
    >
      {defaultValues?.waitlistId ? (
        <input
          type="hidden"
          name="waitlistId"
          value={defaultValues.waitlistId}
        />
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            name="firstName"
            required
            placeholder="First name"
            defaultValue={defaultValues?.firstName ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            name="lastName"
            required
            placeholder="Last name"
            defaultValue={defaultValues?.lastName ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="Email address"
            defaultValue={defaultValues?.email ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            placeholder="Phone number"
            defaultValue={defaultValues?.phone ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <select
            id="gender"
            name="gender"
            defaultValue={defaultValues?.gender ?? ""}
            className="h-10 w-full rounded-md border bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Select gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Specialties (courses they can teach)</Label>
          <div className="flex gap-2">
            <Input
              value={specialtyInput}
              onChange={(e) => setSpecialtyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSpecialty();
                }
              }}
              placeholder="Type specialty and press Enter or Add"
            />
            <Button type="button" variant="outline" onClick={addSpecialty}>
              Add
            </Button>
          </div>
          {specialties.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {specialties.map((s) => (
                <span
                  key={s}
                  className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() =>
                      setSpecialties(specialties.filter((x) => x !== s))
                    }
                    className="ml-1 hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <input
            type="hidden"
            name="specialties"
            value={specialties.join("||")}
          />
          <input type="hidden" name="specialty" value={specialties[0] ?? ""} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            name="bio"
            rows={3}
            placeholder="Short bio..."
            defaultValue={defaultValues?.bio ?? ""}
          />
        </div>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : isEdit ? "Save Teacher" : "Add Teacher"}
      </Button>
    </form>
  );
}

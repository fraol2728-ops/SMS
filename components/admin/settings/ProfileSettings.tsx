"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfileSettings } from "@/lib/actions/settings";
import type { AdminSettingsData, AdminUserData } from "./types";

export function ProfileSettings({
  user,
}: {
  user: AdminUserData;
  settings: AdminSettingsData;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await updateProfileSettings(formData);
      if (res.success) {
        toast.success("Profile updated successfully");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white p-4 sm:p-6">
      <h2 className="mb-1 text-lg font-semibold text-gray-900">
        Profile Settings
      </h2>
      <p className="mb-6 text-sm text-gray-500">
        Update your personal information
      </p>

      <div className="mb-6 flex items-center gap-4 rounded-xl bg-gray-50 p-4">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-2xl font-bold text-blue-700">
          {user.firstName?.[0]}
          {user.lastName?.[0]}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-sm text-gray-500">{user.campus?.name} Campus</p>
          <p className="mt-0.5 text-xs text-gray-400">{user.role}</p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              defaultValue={user.firstName}
              id="firstName"
              name="firstName"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              defaultValue={user.lastName}
              id="lastName"
              name="lastName"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              defaultValue={user.phone ?? ""}
              id="phone"
              name="phone"
              placeholder="Phone number"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gender">Gender</Label>
            <select
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
              defaultValue={user.gender ?? ""}
              id="gender"
              name="gender"
            >
              <option value="">Select gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              defaultValue={user.address ?? ""}
              id="address"
              name="address"
              placeholder="Your address"
              rows={2}
            />
          </div>
        </div>

        <Button disabled={loading} type="submit">
          {loading ? "Saving..." : "Save Profile"}
        </Button>
      </form>
    </div>
  );
}

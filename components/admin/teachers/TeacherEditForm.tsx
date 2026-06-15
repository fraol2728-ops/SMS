"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ProfilePhotoUpload } from "@/components/shared/ProfilePhotoUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateTeacher } from "@/lib/actions/admin";

export function TeacherEditForm({
  teacherProfile,
  user,
}: {
  teacherProfile: any;
  user: any;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(user.profilePhoto ?? "");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set("profilePhoto", profilePhoto);
      const res = await updateTeacher(teacherProfile.id, formData);
      if (res.success) {
        toast.success("Teacher updated");
        router.push(`/admin/teachers/${teacherProfile.id}`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-2xl p-6 space-y-4"
    >
      <div className="flex justify-center mb-2">
        <ProfilePhotoUpload
          currentUrl={user.profilePhoto}
          onUpload={setProfilePhoto}
          onRemove={() => setProfilePhoto("")}
          name={`${user.firstName} ${user.lastName}`}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>First Name *</Label>
          <Input name="firstName" required defaultValue={user.firstName} />
        </div>
        <div className="space-y-1.5">
          <Label>Last Name *</Label>
          <Input name="lastName" required defaultValue={user.lastName} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input name="email" type="email" defaultValue={user.email ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label>Phone</Label>
        <Input name="phone" defaultValue={user.phone ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label>Address</Label>
        <Input name="address" defaultValue={user.address ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label>Telegram</Label>
        <Input name="telegram" defaultValue={user.telegram ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label>Bio</Label>
        <Input name="bio" defaultValue={teacherProfile.bio ?? ""} />
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

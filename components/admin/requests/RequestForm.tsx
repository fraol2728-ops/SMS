"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addCourseRequest } from "@/lib/actions/requests";

export function RequestForm({
  defaultValues,
  redirectTo = "/admin/requests",
}: {
  defaultValues?: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    courseName: string;
    notes: string;
  }>;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await addCourseRequest(new FormData(e.currentTarget));
      if (res.success) {
        toast.success("Request added");
        router.push(redirectTo);
      } else toast.error(res.error);
    } finally {
      setLoading(false);
    }
  }
  return (
    <form
      onSubmit={onSubmit}
      className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-6 space-y-4"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>First Name *</Label>
          <Input
            name="firstName"
            required
            defaultValue={defaultValues?.firstName}
            placeholder="First name"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Last Name *</Label>
          <Input
            name="lastName"
            required
            defaultValue={defaultValues?.lastName}
            placeholder="Last name"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Phone Number *</Label>
          <Input
            name="phone"
            required
            defaultValue={defaultValues?.phone}
            placeholder="Phone number"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Requested Course *</Label>
          <Input
            name="courseName"
            required
            placeholder="e.g. Web Development"
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label>Notes (optional)</Label>
          <Textarea
            name="notes"
            rows={2}
            placeholder="Any additional notes..."
          />
        </div>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Adding..." : "Add Request"}
      </Button>
    </form>
  );
}

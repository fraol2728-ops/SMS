"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCampus } from "@/lib/actions/super-admin";

export function CampusForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    try {
      const res = await createCampus(formData);
      if (res.success) {
        toast.success("Campus created successfully");
        router.push("/super-admin/campuses");
      } else {
        toast.error(res.error);
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
      className="max-w-lg space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="name">Campus Name *</Label>
        <Input id="name" name="name" required placeholder="e.g. Megenagna" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          name="location"
          placeholder="e.g. Megenagna Square, Addis Ababa"
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Campus"}
      </Button>
    </form>
  );
}

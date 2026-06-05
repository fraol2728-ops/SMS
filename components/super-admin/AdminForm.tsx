"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAdmin, updateAdmin } from "@/lib/actions/super-admin";

type Campus = { id: string; name: string };
type Admin = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  campusId: string;
};

type AdminFormProps = {
  campuses: Campus[];
  admin?: Admin;
  isEdit?: boolean;
};

export function AdminForm({ campuses, admin, isEdit = false }: AdminFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    try {
      const res = isEdit && admin 
        ? await updateAdmin(admin.id, formData)
        : await createAdmin(formData);
      
      if (res.success) {
        toast.success(isEdit ? "Admin updated successfully." : "Admin added. Invitation email sent.");
        router.push("/super-admin/admins");
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
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input 
            id="firstName" 
            name="firstName" 
            defaultValue={admin?.firstName}
            required 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input 
            id="lastName" 
            name="lastName" 
            defaultValue={admin?.lastName}
            required 
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input 
          id="email" 
          name="email" 
          type="email" 
          defaultValue={admin?.email}
          disabled={isEdit}
          required 
        />
        {!isEdit && (
          <p className="text-xs text-muted-foreground">
            An invitation will be sent to this email.
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input 
          id="phone" 
          name="phone" 
          defaultValue={admin?.phone ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="campusId">Assign to Campus *</Label>
        <select
          id="campusId"
          name="campusId"
          defaultValue={admin?.campusId ?? ""}
          required
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Select campus</option>
          {campuses.map((campus) => (
            <option key={campus.id} value={campus.id}>
              {campus.name}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? (isEdit ? "Updating..." : "Creating...") : (isEdit ? "Update Admin" : "Create Admin & Send Invite")}
      </Button>
    </form>
  );
}

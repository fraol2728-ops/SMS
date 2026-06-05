"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteAdmin } from "@/lib/actions/super-admin";

export function DeleteAdminButton({ adminId }: { adminId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this admin? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      const res = await deleteAdmin(adminId);
      if (res.success) {
        toast.success("Admin deleted successfully.");
        router.push("/super-admin/admins");
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Trash2 size={15} /> {loading ? "Deleting..." : "Delete"}
    </button>
  );
}

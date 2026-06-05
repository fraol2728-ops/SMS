"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { toggleBlockAdmin } from "@/lib/actions/super-admin";

export function BlockAdminButton({
  adminId,
  isActive,
}: {
  adminId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggleBlock() {
    const action = isActive ? "block" : "unblock";
    if (!confirm(`Are you sure you want to ${action} this admin?`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await toggleBlockAdmin(adminId);
      if (res.success) {
        toast.success(`Admin ${action}ed successfully.`);
        // Refresh the page to show updated status
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggleBlock}
      disabled={loading}
      className={`flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-sm text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        isActive
          ? "bg-yellow-600 hover:bg-yellow-700"
          : "bg-green-600 hover:bg-green-700"
      }`}
    >
      {isActive ? (
        <>
          <Lock size={15} /> {loading ? "Blocking..." : "Block"}
        </>
      ) : (
        <>
          <Unlock size={15} /> {loading ? "Unblocking..." : "Unblock"}
        </>
      )}
    </button>
  );
}

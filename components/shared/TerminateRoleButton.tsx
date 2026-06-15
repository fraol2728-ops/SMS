"use client";

import { ShieldOff, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { terminateUserRole } from "@/lib/actions/admin";

export function TerminateRoleButton({
  userId,
  userName,
  userRole,
}: {
  userId: string;
  userName: string;
  userRole: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleTerminate() {
    setLoading(true);
    try {
      const res = await terminateUserRole(userId);
      if (res.success) {
        toast.success(
          "Role terminated. User can no longer access their portal.",
        );
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-2xl border border-orange-200 dark:border-orange-900 transition-colors"
        type="button"
      >
        <ShieldOff size={14} />
        Terminate Role
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            aria-label="Close terminate role dialog"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            type="button"
          />
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center">
                <ShieldOff size={22} className="text-orange-600" />
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                type="button"
              >
                <X size={18} />
              </button>
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">
              Terminate Role Access
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              You are about to remove the{" "}
              <span className="font-bold text-orange-600">{userRole}</span> role
              from <span className="font-bold dark:text-white">{userName}</span>
              .
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mb-5">
              Their account and all data will remain intact. They will be
              redirected to the unauthorized page on next login. You can restore
              their role at any time.
            </p>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-5">
              <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                ⚠️ This does NOT delete the account — only removes portal access.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleTerminate}
                disabled={loading}
                className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold rounded-2xl transition-colors"
                type="button"
              >
                {loading ? "Terminating..." : "Confirm Terminate"}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="px-5 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-2xl"
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

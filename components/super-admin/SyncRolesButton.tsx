"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type SyncRoleResult = {
  clerkId?: string;
  email: string;
  error?: string;
  role: string;
  status: "success" | "synced_pending" | "not_in_clerk_yet" | "failed";
};

type SyncRolesResponse = {
  message: string;
  results?: SyncRoleResult[];
  success?: boolean;
};

export function SyncRolesButton() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SyncRolesResponse | null>(null);

  async function handleSync() {
    if (
      !confirm(
        "This will update all user roles in Clerk from the database. Continue?",
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/sync-all-roles");
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setResults(data);
      } else {
        toast.error(data.error ?? "Sync failed");
      }
    } catch {
      toast.error("Failed to sync roles");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <button
        className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-sm text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        disabled={loading}
        onClick={handleSync}
        type="button"
      >
        <RefreshCw className={loading ? "animate-spin" : ""} size={15} />
        {loading ? "Syncing..." : "Sync All Roles Now"}
      </button>

      {results && (
        <div className="rounded-xl bg-gray-50 p-4 text-sm dark:bg-gray-800">
          <p className="mb-2 font-medium dark:text-white">{results.message}</p>
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {results.results?.map((r) => (
              <div
                className="flex items-center gap-2 text-xs"
                key={`${r.email}-${r.status}`}
              >
                <span
                  className={`h-2 w-2 flex-shrink-0 rounded-full ${
                    r.status === "success" || r.status === "synced_pending"
                      ? "bg-green-500"
                      : r.status === "not_in_clerk_yet"
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }`}
                />
                <span className="text-gray-600 dark:text-gray-300">
                  {r.email}
                </span>
                <span className="text-gray-400">—</span>
                <span
                  className={
                    r.status === "success" || r.status === "synced_pending"
                      ? "text-green-600 dark:text-green-400"
                      : r.status === "not_in_clerk_yet"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-red-600 dark:text-red-400"
                  }
                >
                  {r.role} — {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

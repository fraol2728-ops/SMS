"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function SyncMyRoleButton() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSync() {
    setLoading(true);
    try {
      const res = await fetch("/api/sync-clerk-ids");
      const data = await res.json();

      if (data.success) {
        setDone(true);
        setMessage(data.message);
        toast.success("Role activated! Please sign out and sign back in.");
      } else if (data.error === "User not found in database") {
        toast.error(
          "Your email is not registered. Contact your administrator.",
        );
      } else {
        toast.error(data.error ?? "Failed to sync role");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
        <p className="font-medium text-green-800 text-sm">{message}</p>
        <p className="mt-1 text-green-600 text-xs">
          Now sign out and sign back in to access your portal.
        </p>
      </div>
    );
  }

  return (
    <button
      className="mx-auto flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      disabled={loading}
      onClick={handleSync}
      type="button"
    >
      <RefreshCw className={loading ? "animate-spin" : ""} size={16} />
      {loading ? "Activating..." : "Activate My Role"}
    </button>
  );
}

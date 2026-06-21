"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { setSchedulerAccess } from "@/lib/actions/telegram";

type AccessUser = {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  schedulerAccess?: { canView: boolean; canCreate: boolean } | null;
};

export function AccessClient({ users }: { users: AccessUser[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  async function toggle(
    userId: string,
    field: "canView" | "canCreate",
    current: AccessUser["schedulerAccess"],
  ) {
    setLoadingId(userId);
    try {
      const canView =
        field === "canView" ? !current?.canView : (current?.canView ?? false);
      const canCreate =
        field === "canCreate"
          ? !current?.canCreate
          : (current?.canCreate ?? false);
      const res = await setSchedulerAccess(userId, canView, canCreate);
      if (res.success) {
        toast.success("Access updated");
        router.refresh();
      } else toast.error(res.error);
    } finally {
      setLoadingId(null);
    }
  }
  return (
    <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
          <tr>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
              Name
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
              Role
            </th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
              Can View
            </th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
              Can Create/Post
            </th>
          </tr>
        </thead>
        <tbody className="divide-y dark:divide-gray-700">
          {users.map((u) => (
            <tr key={u.id}>
              <td className="py-3 px-4 dark:text-white">
                {u.firstName} {u.lastName}
              </td>
              <td className="py-3 px-4 text-gray-400">{u.role}</td>
              <td className="py-3 px-4 text-center">
                <button
                  type="button"
                  disabled={loadingId === u.id}
                  onClick={() => toggle(u.id, "canView", u.schedulerAccess)}
                  className={`w-10 h-6 rounded-full transition-colors ${u.schedulerAccess?.canView ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"}`}
                >
                  <span
                    className={`block w-5 h-5 bg-white rounded-full transition-transform ${u.schedulerAccess?.canView ? "translate-x-5" : "translate-x-0.5"}`}
                  />
                </button>
              </td>
              <td className="py-3 px-4 text-center">
                <button
                  type="button"
                  disabled={loadingId === u.id}
                  onClick={() => toggle(u.id, "canCreate", u.schedulerAccess)}
                  className={`w-10 h-6 rounded-full transition-colors ${u.schedulerAccess?.canCreate ? "bg-green-600" : "bg-gray-200 dark:bg-gray-700"}`}
                >
                  <span
                    className={`block w-5 h-5 bg-white rounded-full transition-transform ${u.schedulerAccess?.canCreate ? "translate-x-5" : "translate-x-0.5"}`}
                  />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

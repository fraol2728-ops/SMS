"use client";

import Link from "next/link";
import { useState } from "react";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  CONTACTED: "bg-purple-50 text-purple-700",
  ENROLLED: "bg-green-50 text-green-700",
  DECLINED: "bg-red-50 text-red-600",
};
export function RequestsClient({ requests }: { requests: any[] }) {
  const [search, setSearch] = useState("");
  const filtered = requests.filter(
    (r) =>
      `${r.firstName} ${r.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      r.phone.includes(search) ||
      r.courseName.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search by name, phone or course..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full h-10 rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700 px-4 text-sm"
      />
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-12 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-400">No course requests yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Link key={r.id} href={`/admin/requests/${r.id}`}>
              <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-5 hover:border-blue-300">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold dark:text-white">
                      {r.firstName} {r.lastName}
                    </p>
                    <p className="text-sm text-gray-500">📱 {r.phone}</p>
                    <span className="inline-block mt-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      {r.courseName}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {r.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(r.createdAt).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

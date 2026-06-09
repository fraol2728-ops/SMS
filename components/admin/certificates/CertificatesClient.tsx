"use client";

import Link from "next/link";
import { useState } from "react";

type Filter = "ALL" | "PENDING" | "DONE" | "DELIVERED";

type CertificatesClientProps = {
  certificates: any[];
  stats: { total: number; paid: number; done: number; delivered: number };
  basePath?: string;
};

export function CertificatesClient({
  certificates,
  stats,
  basePath = "/admin",
}: CertificatesClientProps) {
  const [filter, setFilter] = useState<Filter>("ALL");

  const filtered = certificates.filter((cert) => {
    if (filter === "PENDING") return !cert.isDone && !cert.isDelivered;
    if (filter === "DONE") return cert.isDone && !cert.isDelivered;
    if (filter === "DELIVERED") return cert.isDelivered;
    return true;
  });

  function getStatusBadge(cert: any) {
    if (cert.isDelivered) {
      return (
        <span className="rounded-full bg-green-50 px-2.5 py-1 font-medium text-green-700 text-xs dark:bg-green-900/30 dark:text-green-400">
          ✓ Delivered
        </span>
      );
    }
    if (cert.isDone) {
      return (
        <span className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700 text-xs dark:bg-blue-900/30 dark:text-blue-400">
          📦 Ready
        </span>
      );
    }
    return (
      <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700 text-xs dark:bg-amber-900/30 dark:text-amber-400">
        ⏳ Pending
      </span>
    );
  }

  const studentName = (cert: any) =>
    cert.manualStudentName ??
    (cert.student
      ? `${cert.student.user.firstName} ${cert.student.user.lastName}`
      : "—");

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: "Total Claimed",
            value: stats.total,
            emoji: "🎓",
            color:
              "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
          },
          {
            label: "Cert Payment Paid",
            value: stats.paid,
            emoji: "✅",
            color:
              "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400",
          },
          {
            label: "Ready (Done)",
            value: stats.done,
            emoji: "📦",
            color:
              "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400",
          },
          {
            label: "Delivered",
            value: stats.delivered,
            emoji: "🚀",
            color:
              "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400",
          },
        ].map(({ label, value, emoji, color }) => (
          <div
            key={label}
            className={`${color.split(" ").slice(0, 2).join(" ")} rounded-2xl p-5`}
          >
            <p className="mb-1 text-2xl">{emoji}</p>
            <p
              className={`font-black text-3xl ${color.split(" ").slice(2).join(" ")}`}
            >
              {value}
            </p>
            <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: "ALL", label: `All (${certificates.length})` },
          {
            id: "PENDING",
            label: `Pending (${certificates.filter((c) => !c.isDone && !c.isDelivered).length})`,
          },
          {
            id: "DONE",
            label: `Ready (${certificates.filter((c) => c.isDone && !c.isDelivered).length})`,
          },
          {
            id: "DELIVERED",
            label: `Delivered (${certificates.filter((c) => c.isDelivered).length})`,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as Filter)}
            className={`rounded-xl px-4 py-2 font-medium text-sm transition-all ${
              filter === tab.id
                ? "bg-blue-600 text-white"
                : "border bg-white text-gray-600 hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
            }`}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-gray-400">No certificates in this category</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((cert) => (
            <Link key={cert.id} href={`${basePath}/certificates/${cert.id}`}>
              <div className="flex items-center justify-between rounded-2xl border bg-white p-5 transition-all hover:border-blue-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-700">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-lg text-white">
                    🎓
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {studentName(cert)}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {cert.course?.title}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-3">
                  {getStatusBadge(cert)}
                  <span
                    className={`rounded-full px-2.5 py-1 font-medium text-xs ${
                      cert.paymentStatus === "PAID"
                        ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                    }`}
                  >
                    Payment: {cert.paymentStatus}
                  </span>
                  <span className="hidden text-gray-400 text-xs sm:block">
                    {new Date(cert.issuedAt).toLocaleDateString("en-GB")}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

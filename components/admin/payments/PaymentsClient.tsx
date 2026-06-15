"use client";

import { AlertCircle, CreditCard, Search, TrendingUp, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type PaymentRecord = {
  id: string;
  amount: number;
  method: string | null;
  status: string;
  createdAt: string | Date;
  user: {
    firstName: string;
    lastName: string;
    phone: string | null;
  };
  enrollment: {
    class: {
      course: { title: string } | null;
    } | null;
  } | null;
};

export function PaymentsClient({
  payments,
  stats,
  currentFilters,
}: {
  payments: PaymentRecord[];
  stats: {
    totalRevenue: number;
    monthRevenue: number;
    outstanding: number;
    totalTransactions: number;
  };
  currentFilters: { method: string; status: string; q: string; range: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [filters, setFilters] = useState(currentFilters);

  function apply(newFilters: typeof filters) {
    const p = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) p.set(k, v);
    });
    startTransition(() => router.push(`${pathname}?${p.toString()}`));
  }

  function update(key: string, value: string) {
    const n = { ...filters, [key]: value };
    setFilters(n);
    apply(n);
  }

  function clear() {
    const n = { method: "", status: "", q: "", range: "" };
    setFilters(n);
    apply(n);
  }

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Revenue",
            value: `ETB ${stats.totalRevenue.toLocaleString()}`,
            icon: TrendingUp,
            color:
              "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400",
          },
          {
            label: "This Month",
            value: `ETB ${stats.monthRevenue.toLocaleString()}`,
            icon: CreditCard,
            color:
              "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
          },
          {
            label: "Outstanding",
            value: `ETB ${stats.outstanding.toLocaleString()}`,
            icon: AlertCircle,
            color:
              "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
          },
          {
            label: "Transactions",
            value: stats.totalTransactions,
            icon: CreditCard,
            color:
              "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className={`${color.split(" ").slice(0, 2).join(" ")} rounded-2xl p-5`}
          >
            <Icon
              size={20}
              className={`mb-2 ${color.split(" ").slice(2).join(" ")}`}
            />
            <p
              className={`text-2xl font-black ${color.split(" ").slice(2).join(" ")}`}
            >
              {value}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={filters.q}
              onChange={(e) => update("q", e.target.value)}
              placeholder="Search by student name..."
              className="w-full h-9 pl-9 pr-4 rounded-xl border dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {[
              { value: "", label: "All Time" },
              { value: "month", label: "This Month" },
              { value: "30d", label: "30 Days" },
              { value: "7d", label: "7 Days" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update("range", opt.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filters.range === opt.value ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {["", "PAID", "PENDING"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => update("status", s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filters.status === s ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
            >
              {s || "All Status"}
            </button>
          ))}
          <div className="w-px bg-gray-200 dark:bg-gray-700 mx-1" />
          {["", "CASH", "BANK_TRANSFER", "MOBILE_BANKING"].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => update("method", m)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filters.method === m ? "bg-purple-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
            >
              {m || "All Methods"}
            </button>
          ))}
          {hasFilters && (
            <button
              type="button"
              onClick={clear}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-red-600 border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
        {payments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <CreditCard size={36} className="mx-auto mb-3 opacity-20" />
            <p>No payments found</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                  <tr>
                    {[
                      "Student",
                      "Course",
                      "Amount",
                      "Method",
                      "Status",
                      "Date",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700/50">
                  {payments.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {p.user.firstName[0]}
                            {p.user.lastName[0]}
                          </div>
                          <div>
                            <p className="font-semibold dark:text-white">
                              {p.user.firstName} {p.user.lastName}
                            </p>
                            <p className="text-xs text-gray-400">
                              {p.user.phone ?? "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                        {p.enrollment?.class?.course?.title ?? "—"}
                      </td>
                      <td className="py-3 px-4 font-bold dark:text-white">
                        ETB {p.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                          {p.method ?? "—"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${p.status === "PAID" ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-xs">
                        {new Date(p.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y dark:divide-gray-700">
              {payments.map((p) => (
                <div key={p.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                        {p.user.firstName[0]}
                        {p.user.lastName[0]}
                      </div>
                      <div>
                        <p className="font-semibold dark:text-white text-sm">
                          {p.user.firstName} {p.user.lastName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {p.enrollment?.class?.course?.title ?? "—"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${p.status === "PAID" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold dark:text-white">
                      ETB {p.amount.toLocaleString()}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {p.method ?? "—"} •{" "}
                      {new Date(p.createdAt).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

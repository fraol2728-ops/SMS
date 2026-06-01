"use client";

import { BookOpen, CreditCard, Download, Loader2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const EXPORTS = [
  {
    id: "students",
    label: "All Students",
    description: "Student info, enrollment, class, payment status",
    icon: Users,
    color: "bg-blue-50 text-blue-600",
  },
  {
    id: "payments",
    label: "All Payments",
    description: "Complete payment history and remaining balances",
    icon: CreditCard,
    color: "bg-green-50 text-green-600",
  },
  {
    id: "history",
    label: "Class History",
    description: "All ended classes with student completion data",
    icon: BookOpen,
    color: "bg-purple-50 text-purple-600",
  },
];

export function DataExportSettings() {
  const [downloading, setDownloading] = useState<string | null>(null);
  async function handleExport(id: string) {
    setDownloading(id);
    try {
      const urlMap: Record<string, string> = {
        students: "/api/export/students",
        payments: "/api/export/payments",
        history: "/api/export/history",
      };
      const url = urlMap[id];
      if (!url) throw new Error("Unknown export type");

      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Export failed");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `exceed-${id}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(objectUrl);
      document.body.removeChild(a);
      toast.success(`${id} exported successfully`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setDownloading(null);
    }
  }
  return (
    <div className="space-y-6 rounded-xl border bg-white p-4 dark:border-gray-700 dark:bg-gray-900 sm:p-6">
      <div>
        <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
          Data & Export
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Download your data as Excel files
        </p>
      </div>
      <div className="space-y-3">
        {EXPORTS.map(({ id, label, description, icon: Icon, color }) => (
          <div
            className="flex flex-col gap-3 rounded-xl border p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 sm:flex-row sm:items-center sm:justify-between"
            key={id}
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}
              >
                <Icon size={18} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {label}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">{description}</p>
              </div>
            </div>
            <button
              className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
              disabled={downloading !== null}
              onClick={() => handleExport(id)}
              type="button"
            >
              {downloading === id ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Download size={14} />
              )}
              {downloading === id ? "Exporting..." : "Export"}
            </button>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-medium text-amber-800">📋 About exports</p>
        <p className="mt-1 text-xs text-amber-600">
          Exports include only data from your campus. All files are in Excel
          format (.xlsx).
        </p>
      </div>
    </div>
  );
}

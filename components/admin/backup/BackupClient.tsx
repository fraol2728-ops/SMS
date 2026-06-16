"use client";

import {
  AlertCircle,
  CheckCircle,
  Database,
  Download,
  Loader2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

const DATA_TYPES = [
  { id: "students", label: "Students", icon: "👥", importable: true },
  { id: "withdrawn", label: "Withdrawn", icon: "↩️", importable: false },
  { id: "dropped", label: "Dropped", icon: "🚫", importable: false },
  { id: "courses", label: "Courses", icon: "📚", importable: true },
  { id: "classes", label: "Classes", icon: "🏫", importable: false },
  { id: "teachers", label: "Teachers", icon: "👨‍🏫", importable: false },
  { id: "waitlist", label: "Waitlist", icon: "⏳", importable: false },
  { id: "payments", label: "Payments", icon: "💳", importable: false },
  { id: "remaining", label: "Remaining", icon: "⚠️", importable: false },
  { id: "certificates", label: "Certificates", icon: "🎓", importable: false },
  { id: "coc", label: "COC", icon: "📄", importable: false },
  { id: "requests", label: "Requests", icon: "📬", importable: false },
  { id: "history", label: "History", icon: "📋", importable: false },
  { id: "inventory", label: "Inventory", icon: "📦", importable: true },
];

type ImportResult = {
  success?: boolean;
  message?: string;
  error?: string;
  errors?: string[];
};

export function BackupClient({ campusId }: { campusId: string | null }) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [importResults, setImportResults] = useState<
    Record<string, ImportResult | null>
  >({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  function buildUrl(type: string) {
    const params = new URLSearchParams({ type });
    if (campusId) params.set("campusId", campusId);
    return `/api/backup/download?${params.toString()}`;
  }

  async function handleDownload(type: string) {
    setDownloading(type);
    try {
      const res = await fetch(buildUrl(type));
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download =
        type === "all"
          ? `exceed-full-backup-${date}.xlsx`
          : `exceed-${type}-${date}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(
        type === "all" ? "Full backup downloaded!" : `${type} data downloaded!`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(null);
    }
  }

  async function handleImport(type: string, file: File) {
    setImporting(type);
    setImportResults((prev) => ({ ...prev, [type]: null }));
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      if (campusId) formData.append("campusId", campusId);
      const res = await fetch("/api/backup/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error ?? "Import failed");
      setImportResults((prev) => ({ ...prev, [type]: data }));
      toast.success(data.message);
    } catch (e) {
      const result = {
        success: false,
        error: e instanceof Error ? e.message : "Import failed",
      };
      toast.error(result.error);
      setImportResults((prev) => ({ ...prev, [type]: result }));
    } finally {
      setImporting(null);
      if (fileRefs.current[type]) fileRefs.current[type]!.value = "";
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Database size={22} />
              <h2 className="font-black text-xl">Full Database Backup</h2>
            </div>
            <p className="text-blue-100 text-sm">
              Download all data in one Excel file with separate sheets for each
              category.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleDownload("all")}
            disabled={!!downloading}
            className="flex flex-shrink-0 items-center gap-2 rounded-2xl bg-white px-6 py-3 font-bold text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-50"
          >
            {downloading === "all" ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Download size={18} />
            )}
            {downloading === "all" ? "Preparing..." : "Download All Data"}
          </button>
        </div>
      </div>

      <div>
        <h2 className="mb-4 font-bold text-gray-900 text-lg dark:text-white">
          Individual Data Types
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {DATA_TYPES.map(({ id, label, icon, importable }) => (
            <div
              key={id}
              className="rounded-2xl border bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-xl dark:bg-gray-800">
                  {icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {label}
                  </h3>
                  {!importable && (
                    <p className="text-gray-400 text-xs">Download only</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDownload(id)}
                disabled={!!downloading}
                className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 font-semibold text-blue-700 text-sm transition-colors hover:bg-blue-100 disabled:opacity-50 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
              >
                {downloading === id ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Download size={15} />
                )}
                {downloading === id ? "Downloading..." : `Download ${label}`}
              </button>
              {importable && (
                <>
                  <input
                    ref={(el) => {
                      fileRefs.current[id] = el;
                    }}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleImport(id, file);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileRefs.current[id]?.click()}
                    disabled={!!importing}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-50 px-4 py-2.5 font-semibold text-green-700 text-sm transition-colors hover:bg-green-100 disabled:opacity-50 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
                  >
                    {importing === id ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Upload size={15} />
                    )}
                    {importing === id ? "Importing..." : `Import ${label}`}
                  </button>
                </>
              )}
              {importResults[id] && (
                <div
                  className={`mt-3 rounded-xl p-3 text-xs ${importResults[id]?.success ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"}`}
                >
                  <div className="mb-1 flex items-center gap-1.5 font-semibold">
                    {importResults[id]?.success ? (
                      <CheckCircle size={12} />
                    ) : (
                      <AlertCircle size={12} />
                    )}
                    {importResults[id]?.message ?? importResults[id]?.error}
                  </div>
                  {(importResults[id]?.errors?.length ?? 0) > 0 && (
                    <ul className="mt-1 space-y-0.5 opacity-80">
                      {importResults[id]?.errors?.map((err) => (
                        <li key={`${id}-${err}`}>• {err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-900/20">
        <div className="flex items-start gap-3">
          <AlertCircle
            size={18}
            className="mt-0.5 flex-shrink-0 text-amber-600"
          />
          <div>
            <p className="mb-1 font-bold text-amber-800 text-sm dark:text-amber-300">
              Import Notes
            </p>
            <ul className="space-y-1 text-amber-700 text-xs dark:text-amber-400">
              <li>• Import only supports Students, Courses, and Inventory</li>
              <li>• Use the Download button first to get the correct format</li>
              <li>• Students: existing records are updated by Student Code</li>
              <li>
                • New students must be registered through the Students page
              </li>
              <li>
                • Courses and Inventory: existing records updated, new ones
                created
              </li>
              <li>• All other data is managed through the app</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateAppearanceSettings } from "@/lib/actions/settings";
import type { AdminSettingsData } from "./types";

const SIDEBAR_THEMES = [
  { id: "dark", label: "Dark", colors: ["#111827", "#1f2937"] },
  { id: "blue", label: "Ocean Blue", colors: ["#1e3a5f", "#1d4ed8"] },
  { id: "green", label: "Forest Green", colors: ["#14532d", "#15803d"] },
  { id: "purple", label: "Royal Purple", colors: ["#3b0764", "#7c3aed"] },
  { id: "slate", label: "Slate", colors: ["#0f172a", "#334155"] },
  { id: "red", label: "Deep Red", colors: ["#450a0a", "#b91c1c"] },
];

export function AppearanceSettings({
  settings,
}: {
  settings: AdminSettingsData;
}) {
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(settings?.sidebarTheme ?? "dark");
  const [dateFormat, setDateFormat] = useState(
    settings?.dateFormat ?? "DD/MM/YYYY",
  );
  const [timeFormat, setTimeFormat] = useState(settings?.timeFormat ?? "12h");
  async function handleSave() {
    setLoading(true);
    try {
      const res = await updateAppearanceSettings({
        sidebarTheme: theme,
        dateFormat,
        timeFormat,
      });
      if (res.success) {
        toast.success("Appearance settings saved");
        document.documentElement.setAttribute("data-sidebar-theme", theme);
      } else toast.error(res.error);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="space-y-6 rounded-xl border bg-white p-4 sm:p-6">
      <div>
        <h2 className="mb-1 text-lg font-semibold text-gray-900">Appearance</h2>
        <p className="text-sm text-gray-500">
          Customize the look of your portal
        </p>
      </div>
      <div>
        <p className="mb-3 text-sm font-medium text-gray-700">
          Sidebar Color Theme
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SIDEBAR_THEMES.map((t) => (
            <button
              className={`relative rounded-xl border-2 p-3 transition-all ${theme === t.id ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200 hover:border-gray-300"}`}
              key={t.id}
              onClick={() => setTheme(t.id)}
              type="button"
            >
              <div className="mb-2 flex h-8 gap-1 overflow-hidden rounded-lg">
                <div
                  className="flex-1"
                  style={{ backgroundColor: t.colors[0] }}
                />
                <div className="w-6" style={{ backgroundColor: t.colors[1] }} />
              </div>
              <p className="text-left text-xs font-medium text-gray-700">
                {t.label}
              </p>
              {theme === t.id && (
                <span className="absolute top-2 right-2 text-xs font-bold text-blue-600">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 text-sm font-medium text-gray-700">Date Format</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[
            { id: "DD/MM/YYYY", example: "31/05/2026" },
            { id: "MM/DD/YYYY", example: "05/31/2026" },
            { id: "YYYY-MM-DD", example: "2026-05-31" },
          ].map((f) => (
            <button
              className={`rounded-xl border-2 p-3 text-left transition-all ${dateFormat === f.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
              key={f.id}
              onClick={() => setDateFormat(f.id)}
              type="button"
            >
              <p
                className={`text-xs font-bold ${dateFormat === f.id ? "text-blue-700" : "text-gray-700"}`}
              >
                {f.id}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">{f.example}</p>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 text-sm font-medium text-gray-700">Time Format</p>
        <div className="flex gap-2">
          {[
            { id: "12h", label: "12-hour", example: "2:30 PM" },
            { id: "24h", label: "24-hour", example: "14:30" },
          ].map((f) => (
            <button
              className={`flex-1 rounded-xl border-2 p-3 text-left transition-all ${timeFormat === f.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
              key={f.id}
              onClick={() => setTimeFormat(f.id)}
              type="button"
            >
              <p
                className={`text-sm font-bold ${timeFormat === f.id ? "text-blue-700" : "text-gray-700"}`}
              >
                {f.label}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">{f.example}</p>
            </button>
          ))}
        </div>
      </div>
      <Button disabled={loading} onClick={handleSave}>
        {loading ? "Saving..." : "Save Appearance"}
      </Button>
    </div>
  );
}

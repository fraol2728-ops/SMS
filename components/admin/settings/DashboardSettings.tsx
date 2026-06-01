"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateDashboardSettings } from "@/lib/actions/settings";
import type { AdminSettingsData } from "./types";

const ALL_CARDS = [
  { id: "students", label: "Total Students", emoji: "👥" },
  { id: "revenue", label: "Monthly Revenue", emoji: "💰" },
  { id: "classes", label: "Active Classes", emoji: "📚" },
  { id: "teachers", label: "Teachers", emoji: "👨‍🏫" },
  { id: "attendance", label: "Attendance Rate", emoji: "✅" },
  { id: "remaining", label: "Remaining Payments", emoji: "⏰" },
  { id: "withdrawn", label: "Withdrawn Students", emoji: "⏸️" },
];
const ALL_ACTIONS = [
  "add_student",
  "add_teacher",
  "add_class",
  "mark_attendance",
  "view_remaining",
  "view_reports",
  "generate_report",
].map((id) => ({
  id,
  label: id
    .split("_")
    .map((x) => x[0].toUpperCase() + x.slice(1))
    .join(" "),
}));

export function DashboardSettings({
  settings,
}: {
  settings: AdminSettingsData;
}) {
  const [loading, setLoading] = useState(false);
  const [selectedCards, setSelectedCards] = useState<string[]>(
    settings?.dashboardCards ?? [
      "students",
      "revenue",
      "classes",
      "teachers",
      "attendance",
    ],
  );
  const [defaultView, setDefaultView] = useState(
    settings?.dashboardDefaultView ?? "monthly",
  );
  const [pinnedActions, setPinnedActions] = useState<string[]>(
    settings?.dashboardPinnedActions ?? [
      "add_student",
      "mark_attendance",
      "view_remaining",
    ],
  );
  const toggle = (
    id: string,
    values: string[],
    setValues: (v: string[]) => void,
  ) =>
    setValues(
      values.includes(id) ? values.filter((x) => x !== id) : [...values, id],
    );

  async function handleSave() {
    setLoading(true);
    try {
      const res = await updateDashboardSettings({
        dashboardCards: selectedCards,
        dashboardDefaultView: defaultView,
        dashboardPinnedActions: pinnedActions,
      });
      res.success
        ? toast.success("Dashboard settings saved")
        : toast.error(res.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 rounded-xl border bg-white p-4 sm:p-6">
      <div>
        <h2 className="mb-1 text-lg font-semibold text-gray-900">
          Dashboard Customization
        </h2>
        <p className="text-sm text-gray-500">
          Choose what appears on your dashboard
        </p>
      </div>
      <div>
        <p className="mb-3 text-sm font-medium text-gray-700">
          KPI Cards to Show
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ALL_CARDS.map((card) => (
            <button
              className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${selectedCards.includes(card.id) ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
              key={card.id}
              onClick={() => toggle(card.id, selectedCards, setSelectedCards)}
              type="button"
            >
              <span className="text-xl">{card.emoji}</span>
              <span
                className={`text-sm font-medium ${selectedCards.includes(card.id) ? "text-blue-700" : "text-gray-600"}`}
              >
                {card.label}
              </span>
              {selectedCards.includes(card.id) && (
                <span className="ml-auto text-xs font-bold text-blue-500">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 text-sm font-medium text-gray-700">
          Default Stats View
        </p>
        <div className="flex gap-2">
          {["daily", "weekly", "monthly"].map((view) => (
            <button
              className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium capitalize transition-all ${defaultView === view ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
              key={view}
              onClick={() => setDefaultView(view)}
              type="button"
            >
              {view}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 text-sm font-medium text-gray-700">
          Pinned Quick Actions
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ALL_ACTIONS.map((action) => (
            <button
              className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${pinnedActions.includes(action.id) ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
              key={action.id}
              onClick={() => toggle(action.id, pinnedActions, setPinnedActions)}
              type="button"
            >
              <span
                className={`text-sm font-medium ${pinnedActions.includes(action.id) ? "text-blue-700" : "text-gray-600"}`}
              >
                {action.label}
              </span>
              {pinnedActions.includes(action.id) && (
                <span className="ml-auto text-xs font-bold text-blue-500">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <Button disabled={loading} onClick={handleSave}>
        {loading ? "Saving..." : "Save Dashboard Settings"}
      </Button>
    </div>
  );
}

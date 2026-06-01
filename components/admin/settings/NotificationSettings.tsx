"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateNotificationSettings } from "@/lib/actions/settings";
import type { AdminSettingsData } from "./types";

type ToggleProps = {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
};

function Toggle({
  label,
  description,
  value,
  onChange,
  disabled,
}: ToggleProps) {
  return (
    <div
      className={`flex items-start justify-between rounded-xl border p-4 ${disabled ? "opacity-50" : ""}`}
    >
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="mt-0.5 text-xs text-gray-500">{description}</p>
      </div>
      <button
        className={`relative ml-4 h-6 w-11 flex-shrink-0 rounded-full transition-colors ${value ? "bg-blue-600" : "bg-gray-200"}`}
        disabled={disabled}
        onClick={() => onChange(!value)}
        type="button"
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}

export function NotificationSettings({
  settings,
}: {
  settings: AdminSettingsData;
}) {
  const [loading, setLoading] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(
    settings?.emailNotifications ?? true,
  );
  const [notifyOverduePayments, setNotifyOverduePayments] = useState(
    settings?.notifyOverduePayments ?? true,
  );
  const [notifyTeacherReports, setNotifyTeacherReports] = useState(
    settings?.notifyTeacherReports ?? true,
  );
  const [notifyClassEndingSoon, setNotifyClassEndingSoon] = useState(
    settings?.notifyClassEndingSoon ?? true,
  );
  const [notifyClassFull, setNotifyClassFull] = useState(
    settings?.notifyClassFull ?? true,
  );
  const [notificationFrequency, setNotificationFrequency] = useState(
    settings?.notificationFrequency ?? "instant",
  );

  async function handleSave() {
    setLoading(true);
    try {
      const res = await updateNotificationSettings({
        emailNotifications,
        notifyOverduePayments,
        notifyTeacherReports,
        notifyClassEndingSoon,
        notifyClassFull,
        notificationFrequency,
      });
      res.success
        ? toast.success("Notification settings saved")
        : toast.error(res.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 rounded-xl border bg-white p-4 sm:p-6">
      <div>
        <h2 className="mb-1 text-lg font-semibold text-gray-900">
          Notification Preferences
        </h2>
        <p className="text-sm text-gray-500">
          Control what notifications you receive
        </p>
      </div>
      <Toggle
        description="Receive email alerts for important events"
        label="Email Notifications"
        onChange={setEmailNotifications}
        value={emailNotifications}
      />
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Notify me about:</p>
        <Toggle
          description="When students have overdue remaining payments"
          disabled={!emailNotifications}
          label="Overdue Payments"
          onChange={setNotifyOverduePayments}
          value={notifyOverduePayments}
        />
        <Toggle
          description="When a teacher sends a new report"
          disabled={!emailNotifications}
          label="Teacher Reports"
          onChange={setNotifyTeacherReports}
          value={notifyTeacherReports}
        />
        <Toggle
          description="7 days before a class end date"
          disabled={!emailNotifications}
          label="Class Ending Soon"
          onChange={setNotifyClassEndingSoon}
          value={notifyClassEndingSoon}
        />
        <Toggle
          description="When a class reaches maximum capacity"
          disabled={!emailNotifications}
          label="Class Full"
          onChange={setNotifyClassFull}
          value={notifyClassFull}
        />
      </div>
      <div>
        <p className="mb-3 text-sm font-medium text-gray-700">
          Notification Frequency
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[
            { id: "instant", label: "Instant", desc: "Right away" },
            { id: "daily", label: "Daily Digest", desc: "Once per day" },
            { id: "weekly", label: "Weekly", desc: "Once per week" },
          ].map((f) => (
            <button
              className={`rounded-xl border-2 p-3 text-left transition-all ${notificationFrequency === f.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"} ${!emailNotifications ? "opacity-50" : ""}`}
              disabled={!emailNotifications}
              key={f.id}
              onClick={() => setNotificationFrequency(f.id)}
              type="button"
            >
              <p
                className={`text-sm font-medium ${notificationFrequency === f.id ? "text-blue-700" : "text-gray-700"}`}
              >
                {f.label}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">{f.desc}</p>
            </button>
          ))}
        </div>
      </div>
      <Button disabled={loading} onClick={handleSave}>
        {loading ? "Saving..." : "Save Notification Settings"}
      </Button>
    </div>
  );
}

"use client";

import {
  Bell,
  LayoutDashboard,
  Palette,
  Save,
  Settings,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { saveAdminSettings } from "@/lib/actions/settings";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: {
    showTotalStudents: boolean;
    showActiveClasses: boolean;
    showMonthlyRevenue: boolean;
    showOutstanding: boolean;
    showAttendanceRate: boolean;
    showCertificates: boolean;
    accentColor: string;
    sidebarTheme: string;
    dateFormat: string;
    emailOnPaymentDue: boolean;
    emailOnNewStudent: boolean;
  } | null;
}

export function SettingsModal({ open, onClose, settings }: SettingsModalProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"dashboard" | "appearance" | "notifications">(
    "dashboard",
  );
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    showTotalStudents: settings?.showTotalStudents ?? true,
    showActiveClasses: settings?.showActiveClasses ?? true,
    showMonthlyRevenue: settings?.showMonthlyRevenue ?? true,
    showOutstanding: settings?.showOutstanding ?? true,
    showAttendanceRate: settings?.showAttendanceRate ?? true,
    showCertificates: settings?.showCertificates ?? true,
    accentColor: settings?.accentColor ?? "blue",
    sidebarTheme: settings?.sidebarTheme ?? "dark",
    dateFormat: settings?.dateFormat ?? "DD/MM/YYYY",
    emailOnPaymentDue: settings?.emailOnPaymentDue ?? true,
    emailOnNewStudent: settings?.emailOnNewStudent ?? true,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        showTotalStudents: settings.showTotalStudents,
        showActiveClasses: settings.showActiveClasses,
        showMonthlyRevenue: settings.showMonthlyRevenue,
        showOutstanding: settings.showOutstanding,
        showAttendanceRate: settings.showAttendanceRate,
        showCertificates: settings.showCertificates,
        accentColor: settings.accentColor,
        sidebarTheme: settings.sidebarTheme,
        dateFormat: settings.dateFormat,
        emailOnPaymentDue: settings.emailOnPaymentDue,
        emailOnNewStudent: settings.emailOnNewStudent,
      });
    }
  }, [settings]);

  if (!open) return null;

  async function handleSave() {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (typeof value === "boolean") {
          if (value) formData.set(key, "on");
        } else {
          formData.set(key, value);
        }
      });
      const res = await saveAdminSettings(formData);
      if (res.success) {
        toast.success("Settings saved!");
        onClose();
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  const Toggle = ({ field }: { field: keyof typeof form }) => (
    <button
      type="button"
      onClick={() =>
        setForm((current) => ({ ...current, [field]: !current[field] }))
      }
      className={`relative h-6 w-11 rounded-full transition-colors ${form[field] ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-600"}`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form[field] ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        aria-label="Close settings"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />
      <div className="relative mx-4 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900">
        <div className="flex flex-shrink-0 items-center justify-between border-b p-5 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
              <Settings className="text-white" size={18} />
            </div>
            <div>
              <h2 className="font-black text-gray-900 dark:text-white">
                Settings
              </h2>
              <p className="text-gray-400 text-xs">Customize your portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            type="button"
          >
            <X className="text-gray-500" size={18} />
          </button>
        </div>
        <div className="flex flex-shrink-0 border-b dark:border-gray-700">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "appearance", label: "Appearance", icon: Palette },
            { id: "notifications", label: "Notifications", icon: Bell },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id as typeof tab)}
              className={`flex flex-1 items-center justify-center gap-2 py-3 font-semibold text-xs transition-colors ${tab === item.id ? "border-blue-600 border-b-2 text-blue-600 dark:border-blue-400 dark:text-blue-400" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"}`}
              type="button"
            >
              <item.icon size={14} />
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "dashboard" && (
            <div className="space-y-4">
              <p className="text-gray-500 text-sm dark:text-gray-400">
                Choose which KPI cards to show on your dashboard.
              </p>
              {[
                [
                  "showTotalStudents",
                  "Total Students",
                  "Number of registered students",
                ],
                [
                  "showActiveClasses",
                  "Active Classes",
                  "Currently running classes",
                ],
                [
                  "showMonthlyRevenue",
                  "Monthly Revenue",
                  "Revenue collected this month",
                ],
                ["showOutstanding", "Outstanding", "Unpaid remaining balances"],
                [
                  "showAttendanceRate",
                  "Attendance Rate",
                  "Average attendance this month",
                ],
                [
                  "showCertificates",
                  "Certificates Pending",
                  "Certificates waiting for delivery",
                ],
              ].map(([key, label, desc]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-2xl bg-gray-50 p-3 dark:bg-gray-800"
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm dark:text-white">
                      {label}
                    </p>
                    <p className="mt-0.5 text-gray-400 text-xs">{desc}</p>
                  </div>
                  <Toggle field={key as keyof typeof form} />
                </div>
              ))}
            </div>
          )}
          {tab === "appearance" && (
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="font-semibold text-gray-700 text-sm dark:text-gray-300">
                  Accent Color
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "blue", color: "bg-blue-600" },
                    { id: "purple", color: "bg-purple-600" },
                    { id: "green", color: "bg-green-600" },
                    { id: "red", color: "bg-red-600" },
                    { id: "amber", color: "bg-amber-500" },
                    { id: "teal", color: "bg-teal-600" },
                  ].map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          accentColor: color.id,
                        }))
                      }
                      className={`h-9 w-9 rounded-xl ${color.color} transition-all ${form.accentColor === color.id ? "scale-110 ring-4 ring-gray-400 ring-offset-2 dark:ring-offset-gray-900" : "opacity-60 hover:opacity-100"}`}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-gray-700 text-sm dark:text-gray-300">
                  Date Format
                </p>
                <div className="flex flex-wrap gap-2">
                  {["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"].map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({ ...current, dateFormat: fmt }))
                      }
                      className={`rounded-xl border-2 px-4 py-2 font-medium text-xs transition-all ${form.dateFormat === fmt ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" : "border-gray-200 text-gray-600 dark:border-gray-600 dark:text-gray-400"}`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {tab === "notifications" && (
            <div className="space-y-3">
              <p className="text-gray-500 text-sm dark:text-gray-400">
                Choose when to receive notifications.
              </p>
              {[
                [
                  "emailOnPaymentDue",
                  "Payment Due Alerts",
                  "Notify when student payments are overdue",
                ],
                [
                  "emailOnNewStudent",
                  "New Student Alerts",
                  "Notify when a new student is registered",
                ],
              ].map(([key, label, desc]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-2xl bg-gray-50 p-3 dark:bg-gray-800"
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm dark:text-white">
                      {label}
                    </p>
                    <p className="mt-0.5 text-gray-400 text-xs">{desc}</p>
                  </div>
                  <Toggle field={key as keyof typeof form} />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex-shrink-0 border-t p-5 dark:border-gray-700">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            type="button"
          >
            <Save size={16} />
            {loading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}

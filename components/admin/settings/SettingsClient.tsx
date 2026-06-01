"use client";

import {
  Bell,
  BookOpen,
  CreditCard,
  Download,
  LayoutDashboard,
  Palette,
  Shield,
  User,
} from "lucide-react";
import { useState } from "react";
import { AccountSettings } from "./AccountSettings";
import { AppearanceSettings } from "./AppearanceSettings";
import { ClassSettings } from "./ClassSettings";
import { DashboardSettings } from "./DashboardSettings";
import { DataExportSettings } from "./DataExportSettings";
import { NotificationSettings } from "./NotificationSettings";
import { PaymentSettings } from "./PaymentSettings";
import { ProfileSettings } from "./ProfileSettings";
import type { AdminSettingsData, AdminUserData } from "./types";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "classes", label: "Classes", icon: BookOpen },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "data", label: "Data & Export", icon: Download },
  { id: "account", label: "Account", icon: Shield },
];

export function SettingsClient({
  user,
  settings,
}: {
  user: AdminUserData;
  settings: AdminSettingsData;
}) {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex-shrink-0 lg:w-56">
        <div className="flex gap-1 overflow-x-auto rounded-xl border bg-white p-2 lg:flex-col lg:overflow-x-visible">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              className={`flex w-full items-center gap-3 whitespace-nowrap rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-all ${
                activeTab === id
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              key={id}
              onClick={() => setActiveTab(id)}
              type="button"
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        {activeTab === "profile" && (
          <ProfileSettings settings={settings} user={user} />
        )}
        {activeTab === "dashboard" && <DashboardSettings settings={settings} />}
        {activeTab === "notifications" && (
          <NotificationSettings settings={settings} />
        )}
        {activeTab === "payments" && <PaymentSettings settings={settings} />}
        {activeTab === "classes" && <ClassSettings settings={settings} />}
        {activeTab === "appearance" && (
          <AppearanceSettings settings={settings} />
        )}
        {activeTab === "data" && <DataExportSettings />}
        {activeTab === "account" && <AccountSettings user={user} />}
      </div>
    </div>
  );
}

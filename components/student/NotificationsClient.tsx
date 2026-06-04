"use client";

import type { StudentNotification, User } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Bell, CheckCircle, Clock, Info } from "lucide-react";

type NotificationWithCreator = StudentNotification & {
  createdBy: Pick<User, "firstName" | "lastName">;
};

const TYPE_CONFIG: Record<
  string,
  { icon: LucideIcon; color: string; bg: string; border: string }
> = {
  INFO: {
    icon: Info,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  WARNING: {
    icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  SUCCESS: {
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-100",
  },
  REMINDER: {
    icon: Clock,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100",
  },
};

export function NotificationsClient({
  notifications,
}: {
  notifications: NotificationWithCreator[];
}) {
  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-16 text-center">
        <Bell size={48} className="mx-auto text-gray-200 mb-4" />
        <h2 className="font-bold text-gray-400">No notifications yet</h2>
        <p className="text-gray-300 text-sm mt-2">
          Announcements from your admin will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((n) => {
        const config = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.INFO;
        const Icon = config.icon;
        return (
          <div
            key={n.id}
            className={`bg-white border ${config.border} rounded-2xl p-5 shadow-sm`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-11 h-11 ${config.bg} rounded-2xl flex items-center justify-center flex-shrink-0`}
              >
                <Icon size={20} className={config.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900">{n.title}</p>
                <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                  {n.body}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  From {n.createdBy.firstName} {n.createdBy.lastName} •{" "}
                  {new Date(n.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { Bell, BookOpen, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendStudentNotification } from "@/lib/actions/admin";

export function NotificationComposer({
  classes,
  totalStudents,
}: {
  classes: any[];
  totalStudents: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [target, setTarget] = useState("ALL");
  const [type, setType] = useState("INFO");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set("target", target);
      formData.set("type", type);
      const res = await sendStudentNotification(formData);
      if (res.success) {
        toast.success(
          `Notification sent to ${res.count} student${res.count !== 1 ? "s" : ""}`,
        );
        e.currentTarget.reset();
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Bell size={18} className="text-blue-600" />
        <h2 className="font-semibold dark:text-white">Send Notification</h2>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <div className="flex gap-2 flex-wrap">
            {[
              { id: "INFO", label: "Info", emoji: "ℹ️" },
              { id: "WARNING", label: "Warning", emoji: "⚠️" },
              { id: "SUCCESS", label: "Success", emoji: "✅" },
              { id: "REMINDER", label: "Reminder", emoji: "⏰" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                  type === t.id
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                }`}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Send To</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTarget("ALL")}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                target === "ALL"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300"
              }`}
            >
              <Users size={15} />
              All Students ({totalStudents})
            </button>
            <button
              type="button"
              onClick={() => setTarget("CLASS")}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                target === "CLASS"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300"
              }`}
            >
              <BookOpen size={15} />
              Specific Class
            </button>
          </div>
          {target === "CLASS" && (
            <select
              name="classId"
              className="h-10 w-full rounded-xl border bg-background dark:bg-gray-800 dark:border-gray-600 px-3 text-sm mt-2"
            >
              <option value="">Select class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.lab?.name ?? "Online"} — {c.course.title}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Title *</Label>
          <Input name="title" required placeholder="Notification title..." />
        </div>

        <div className="space-y-1.5">
          <Label>Message *</Label>
          <Textarea
            name="body"
            required
            rows={4}
            placeholder="Write your message to students..."
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full gap-2">
          <Bell size={15} />
          {loading ? "Sending..." : "Send Notification"}
        </Button>
      </form>
    </div>
  );
}

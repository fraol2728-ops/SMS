"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateClassSettings } from "@/lib/actions/settings";
import type { AdminSettingsData } from "./types";

export function ClassSettings({ settings }: { settings: AdminSettingsData }) {
  const [loading, setLoading] = useState(false);
  const [capacity, setCapacity] = useState(
    settings?.defaultClassCapacity ?? 20,
  );
  const [duration, setDuration] = useState(
    settings?.defaultCourseDuration ?? 8,
  );
  async function handleSave() {
    setLoading(true);
    try {
      const res = await updateClassSettings({
        defaultClassCapacity: Number(capacity),
        defaultCourseDuration: Number(duration),
      });
      res.success
        ? toast.success("Class settings saved")
        : toast.error(res.error);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="space-y-6 rounded-xl border bg-white p-4 sm:p-6">
      <div>
        <h2 className="mb-1 text-lg font-semibold text-gray-900">
          Class & Registration Settings
        </h2>
        <p className="text-sm text-gray-500">
          Set defaults for new classes and courses
        </p>
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="capacity">Default Class Capacity</Label>
          <Input
            id="capacity"
            max={50}
            min={1}
            onChange={(e) => setCapacity(Number(e.target.value))}
            type="number"
            value={capacity}
          />
          <p className="text-xs text-gray-400">
            Maximum students per class (can be changed per class)
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="duration">Default Course Duration (weeks)</Label>
          <select
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            id="duration"
            onChange={(e) => setDuration(Number(e.target.value))}
            value={duration}
          >
            {[2, 4, 5, 6, 7, 8, 10, 12, 16, 24].map((w) => (
              <option key={w} value={w}>
                {w} weeks
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400">
            Pre-selected duration when creating new courses
          </p>
        </div>
      </div>
      <Button disabled={loading} onClick={handleSave}>
        {loading ? "Saving..." : "Save Class Settings"}
      </Button>
    </div>
  );
}

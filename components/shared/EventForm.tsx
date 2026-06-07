"use client";

import { BookOpen, Calendar, Clock, MapPin, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createEvent } from "@/lib/actions/events";
import { CloudinaryUpload } from "./CloudinaryUpload";

interface EventFormProps {
  classes?: {
    id: string;
    course: { title: string };
    lab?: { name: string } | null;
  }[];
  campusName?: string;
  redirectPath?: string;
}

export function EventForm({
  classes = [],
  campusName,
  redirectPath = "/admin/events",
}: EventFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [targetAll, setTargetAll] = useState(true);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  function toggleClass(id: string) {
    setSelectedClassIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set("thumbnailUrl", thumbnailUrl);
      formData.set("targetAll", String(targetAll));
      formData.set("targetClassIds", selectedClassIds.join(","));

      const res = await createEvent(formData);
      if (res.success) {
        toast.success("Event created successfully! 🎉");
        router.push(redirectPath);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Event Thumbnail</Label>
        <CloudinaryUpload
          onUpload={setThumbnailUrl}
          onRemove={() => setThumbnailUrl("")}
        />
        {thumbnailUrl && (
          <input type="hidden" name="thumbnailUrl" value={thumbnailUrl} />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Event Title *</Label>
        <Input
          id="title"
          name="title"
          required
          placeholder="e.g. Digital Marketing Workshop"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          name="description"
          required
          rows={4}
          placeholder="Describe the event, what to expect, who should attend..."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">
            <Calendar size={14} className="mr-1 inline" />
            Date *
          </Label>
          <input
            id="date"
            name="date"
            type="date"
            required
            min={new Date().toISOString().slice(0, 10)}
            className="h-10 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">
            <Clock size={14} className="mr-1 inline" />
            Time *
          </Label>
          <Input
            id="time"
            name="time"
            required
            placeholder="e.g. 2:00 PM - 4:00 PM"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">
          <MapPin size={14} className="mr-1 inline" />
          Location (optional)
        </Label>
        <Input
          id="location"
          name="location"
          placeholder="e.g. Lab 1, Main Hall, Online"
        />
      </div>

      <div className="space-y-3">
        <Label>Send To</Label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setTargetAll(true)}
            className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 font-medium text-sm transition-all ${
              targetAll
                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:text-gray-400"
            }`}
          >
            <Users size={15} />
            All Teachers & Students
            {campusName && (
              <span className="text-xs opacity-70">({campusName})</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setTargetAll(false)}
            className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 font-medium text-sm transition-all ${
              !targetAll
                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:text-gray-400"
            }`}
          >
            <BookOpen size={15} />
            Specific Classes
          </button>
        </div>

        {!targetAll && classes.length > 0 && (
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {classes.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleClass(c.id)}
                className={`flex items-center gap-2 rounded-xl border-2 p-3 text-left text-sm transition-all ${
                  selectedClassIds.includes(c.id)
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                    : "border-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-600 dark:text-gray-300"
                }`}
              >
                <span
                  className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 ${
                    selectedClassIds.includes(c.id)
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300 dark:border-gray-500"
                  }`}
                >
                  {selectedClassIds.includes(c.id) && (
                    <span className="font-bold text-white text-xs">✓</span>
                  )}
                </span>
                <span className="truncate">
                  {c.lab?.name ?? "Online"} — {c.course.title}
                </span>
              </button>
            ))}
          </div>
        )}

        {!targetAll && classes.length === 0 && (
          <p className="text-amber-600 text-xs dark:text-amber-400">
            No active classes found. Event will be sent to all.
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full gap-2 bg-blue-600 hover:bg-blue-700 sm:w-auto"
        size="lg"
      >
        {loading ? "Creating Event..." : "🎉 Create Event"}
      </Button>
    </form>
  );
}

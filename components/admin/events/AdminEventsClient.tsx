"use client";

import { CalendarDays, History, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { EventCard } from "@/components/shared/EventCard";
import { EventForm } from "@/components/shared/EventForm";
import { Button } from "@/components/ui/button";
import { deleteEvent } from "@/lib/actions/events";

type AdminEvent = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string | null;
  date: Date | string;
  time: string;
  location?: string | null;
  targetAll: boolean;
  campus?: { name: string } | null;
};

type EventClass = {
  id: string;
  course: { title: string };
  lab?: { name: string } | null;
};

type AdminEventsClientProps = {
  upcoming: AdminEvent[];
  past: AdminEvent[];
  classes: EventClass[];
  campusName?: string;
};

export function AdminEventsClient({
  upcoming,
  past,
  classes,
  campusName,
}: AdminEventsClientProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  async function handleDelete(id: string) {
    if (!confirm("Delete this event?")) return;
    const res = await deleteEvent(id);
    if (res.success) {
      toast.success("Event deleted");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  const events = tab === "upcoming" ? upcoming : past;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab("upcoming")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-sm transition-all ${
              tab === "upcoming"
                ? "bg-blue-600 text-white"
                : "border bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            <CalendarDays size={15} />
            Upcoming ({upcoming.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("past")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-sm transition-all ${
              tab === "past"
                ? "bg-gray-700 text-white"
                : "border bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            <History size={15} />
            Past ({past.length})
          </button>
        </div>

        <Button
          onClick={() => setShowForm(!showForm)}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? "Cancel" : "Create Event"}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-3xl border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-5 font-bold text-gray-900 text-lg dark:text-white">
            🎉 Create New Event
          </h2>
          <EventForm
            classes={classes}
            campusName={campusName}
            redirectPath="/admin/events"
          />
        </div>
      )}

      {events.length === 0 ? (
        <div className="rounded-3xl border border-dashed bg-white p-16 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="mb-3 text-4xl">📅</p>
          <p className="font-semibold text-gray-400 dark:text-gray-500">
            {tab === "upcoming" ? "No upcoming events" : "No past events"}
          </p>
          {tab === "upcoming" && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-4 font-medium text-blue-600 text-sm hover:text-blue-800"
            >
              Create your first event →
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              showActions
              isAdmin
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

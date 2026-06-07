"use client";

import { Clock, MapPin, Users } from "lucide-react";
import Image from "next/image";

interface EventCardProps {
  event: {
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
  showActions?: boolean;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}

export function EventCard({
  event,
  showActions,
  onDelete,
  isAdmin,
}: EventCardProps) {
  const eventDate = new Date(event.date);
  const now = new Date();
  const isPast = eventDate < now;
  const isToday = eventDate.toDateString() === now.toDateString();
  const daysUntil = Math.ceil(
    (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  return (
    <div
      className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-900 ${isPast ? "opacity-70" : ""}`}
    >
      {event.thumbnailUrl ? (
        <div className="relative h-44 overflow-hidden">
          <Image
            src={event.thumbnailUrl}
            alt={event.title}
            fill
            unoptimized
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute top-3 left-3 rounded-xl bg-white px-3 py-1.5 shadow-sm dark:bg-gray-900">
            <p className="font-bold text-gray-900 text-xs dark:text-white">
              {eventDate.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
              })}
            </p>
            <p className="text-gray-400 text-xs">{eventDate.getFullYear()}</p>
          </div>
          {isToday && (
            <div className="absolute top-3 right-3 rounded-full bg-green-500 px-3 py-1 font-bold text-white text-xs">
              TODAY
            </div>
          )}
          {!isPast && !isToday && daysUntil <= 7 && (
            <div className="absolute top-3 right-3 rounded-full bg-amber-500 px-3 py-1 font-bold text-white text-xs">
              {daysUntil}d away
            </div>
          )}
          {isPast && (
            <div className="absolute top-3 right-3 rounded-full bg-gray-500 px-3 py-1 font-bold text-white text-xs">
              PAST
            </div>
          )}
        </div>
      ) : (
        <div className="relative flex h-28 items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
          <span className="text-5xl">🎉</span>
          <div className="absolute top-3 left-3 rounded-xl bg-white/20 px-3 py-1.5 backdrop-blur-sm">
            <p className="font-bold text-white text-xs">
              {eventDate.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          {isToday && (
            <div className="absolute top-3 right-3 rounded-full bg-green-500 px-3 py-1 font-bold text-white text-xs">
              TODAY
            </div>
          )}
        </div>
      )}

      <div className="p-5">
        <h3 className="mb-2 font-bold text-gray-900 text-lg leading-tight dark:text-white">
          {event.title}
        </h3>
        <p className="mb-4 line-clamp-2 text-gray-500 text-sm leading-relaxed dark:text-gray-400">
          {event.description}
        </p>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-500 text-sm dark:text-gray-400">
            <Clock size={14} className="flex-shrink-0 text-blue-500" />
            <span>{event.time}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-gray-500 text-sm dark:text-gray-400">
              <MapPin size={14} className="flex-shrink-0 text-red-500" />
              <span>{event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-500 text-sm dark:text-gray-400">
            <Users size={14} className="flex-shrink-0 text-green-500" />
            <span>
              {event.targetAll ? "All students & teachers" : "Selected classes"}
            </span>
          </div>
          {event.campus && (
            <div className="flex items-center gap-2 text-gray-500 text-sm dark:text-gray-400">
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700 text-xs dark:bg-blue-900/30 dark:text-blue-400">
                {event.campus.name}
              </span>
            </div>
          )}
        </div>

        {showActions && isAdmin && onDelete && (
          <div className="mt-4 flex gap-2 border-t pt-4 dark:border-gray-700">
            <button
              type="button"
              onClick={() => onDelete(event.id)}
              className="flex-1 rounded-xl border border-red-200 py-2 font-medium text-red-600 text-xs transition-colors hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20"
            >
              Delete Event
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function DashboardHero({
  campusName,
  adminName,
  dateLabel,
}: {
  campusName?: string | null;
  adminName: string;
  dateLabel: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    setCurrentDate(new Date());
  }, []);

  const greeting = getGreeting(currentDate);
  const firstName = adminName.split(" ")[0];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 p-6 sm:p-8">
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-purple-600/15 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-gray-400 text-sm">{dateLabel}</p>
          <h1 className="mt-1 font-black text-3xl text-white tracking-tight sm:text-4xl">
            {mounted && currentDate ? (
              <>
                {greeting}, <span className="text-blue-400">{firstName}</span>
              </>
            ) : (
              ""
            )}
          </h1>
          <p className="mt-1 text-gray-400 text-sm">
            {campusName
              ? `Here's what's happening at ${campusName} today.`
              : "Here's your campus overview for today."}
          </p>
        </div>
        <div className="flex flex-shrink-0 gap-2">
          <Link href="/admin/students/new">
            <button
              className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 font-bold text-gray-900 text-sm shadow-lg transition-all hover:-translate-y-0.5 hover:bg-gray-100 hover:shadow-xl"
              type="button"
            >
              <Plus size={15} />
              Add Student
            </button>
          </Link>
          <Link href="/admin/students">
            <button
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 font-medium text-sm text-white transition-all hover:bg-white/15"
              type="button"
            >
              All Students
              <ArrowRight size={14} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function getGreeting(currentDate: Date | null) {
  if (!currentDate) return "";
  const hour = currentDate.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

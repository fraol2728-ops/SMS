import { ArrowRight, Plus, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function DashboardHero({
  campusName,
  adminName,
  dateLabel,
}: {
  campusName?: string | null;
  adminName: string;
  dateLabel: string;
}) {
  const greeting = getGreeting();

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-lg sm:rounded-3xl sm:p-6 md:p-8">
      <div className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 size-48 rounded-full bg-violet-500/20 blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-medium text-slate-300">{dateLabel}</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting}, {adminName.split(" ")[0]}
          </h1>
          <p className="max-w-xl text-sm text-slate-300 sm:text-base">
            {campusName
              ? `Here's what's happening at ${campusName} today.`
              : "Here's your campus overview for today."}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
          <Button
            asChild
            className="h-10 rounded-xl bg-white text-slate-900 hover:bg-slate-100"
          >
            <Link href="/admin/students/new">
              <Plus className="size-4" />
              Add student
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-10 rounded-xl border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            <Link href="/admin/students">
              <Users className="size-4" />
              All students
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

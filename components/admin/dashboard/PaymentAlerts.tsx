import { AlertTriangle, ChevronRight, Clock } from "lucide-react";
import Link from "next/link";

export function PaymentAlerts({
  overdueCount,
  dueSoonCount,
}: {
  overdueCount: number;
  dueSoonCount: number;
}) {
  if (overdueCount === 0 && dueSoonCount === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {overdueCount > 0 ? (
        <Link href="/admin/remaining" className="group block">
          <div className="flex items-center gap-4 rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-500/10 to-red-500/5 p-4 transition-all hover:border-red-500/50 hover:shadow-md dark:from-red-950/40 dark:to-red-950/20">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-600 dark:text-red-400">
              <AlertTriangle className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-red-800 dark:text-red-300">
                {overdueCount} overdue payment
                {overdueCount > 1 ? "s" : ""}
              </p>
              <p className="text-sm text-red-600/90 dark:text-red-400/80">
                Students need follow-up on remaining balances
              </p>
            </div>
            <ChevronRight className="size-5 shrink-0 text-red-500 transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>
      ) : null}

      {dueSoonCount > 0 ? (
        <Link href="/admin/remaining" className="group block">
          <div className="flex items-center gap-4 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-amber-500/5 p-4 transition-all hover:border-amber-500/50 hover:shadow-md dark:from-amber-950/40 dark:to-amber-950/20">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Clock className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                {dueSoonCount} due this week
              </p>
              <p className="text-sm text-amber-700/90 dark:text-amber-400/80">
                Payments expected within the next 7 days
              </p>
            </div>
            <ChevronRight className="size-5 shrink-0 text-amber-600 transition-transform group-hover:translate-x-0.5 dark:text-amber-400" />
          </div>
        </Link>
      ) : null}
    </div>
  );
}

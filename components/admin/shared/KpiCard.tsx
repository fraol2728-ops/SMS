import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const colorStyles = {
  blue: {
    icon: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    ring: "ring-blue-500/20",
    gradient: "from-blue-500/10 via-transparent to-transparent",
  },
  green: {
    icon: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500/20",
    gradient: "from-emerald-500/10 via-transparent to-transparent",
  },
  purple: {
    icon: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    ring: "ring-violet-500/20",
    gradient: "from-violet-500/10 via-transparent to-transparent",
  },
  amber: {
    icon: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    ring: "ring-amber-500/20",
    gradient: "from-amber-500/10 via-transparent to-transparent",
  },
  rose: {
    icon: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    ring: "ring-rose-500/20",
    gradient: "from-rose-500/10 via-transparent to-transparent",
  },
} as const;

export function KpiCard({
  title,
  value,
  icon: Icon,
  color,
  href,
  hint,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: keyof typeof colorStyles;
  href?: string;
  hint?: string;
}) {
  const styles = colorStyles[color];

  const content = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-all duration-300 sm:p-5",
        "hover:-translate-y-0.5 hover:border-border hover:shadow-md",
        href && "cursor-pointer",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80 transition-opacity group-hover:opacity-100",
          styles.gradient,
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition-transform group-hover:scale-105",
            styles.icon,
            styles.ring,
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

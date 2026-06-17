import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const colorStyles = {
  blue: {
    icon: "bg-blue-500/15",
    iconColor: "text-blue-600 dark:text-blue-400",
    ring: "ring-blue-500/20",
    gradient: "from-blue-500/10 via-transparent to-transparent",
  },
  green: {
    icon: "bg-emerald-500/15",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500/20",
    gradient: "from-emerald-500/10 via-transparent to-transparent",
  },
  purple: {
    icon: "bg-violet-500/15",
    iconColor: "text-violet-600 dark:text-violet-400",
    ring: "ring-violet-500/20",
    gradient: "from-violet-500/10 via-transparent to-transparent",
  },
  amber: {
    icon: "bg-amber-500/15",
    iconColor: "text-amber-600 dark:text-amber-400",
    ring: "ring-amber-500/20",
    gradient: "from-amber-500/10 via-transparent to-transparent",
  },
  rose: {
    icon: "bg-rose-500/15",
    iconColor: "text-rose-600 dark:text-rose-400",
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
  animationDelay,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: keyof typeof colorStyles;
  href?: string;
  hint?: string;
  animationDelay?: string;
}) {
  const styles = colorStyles[color];

  const content = (
    <div
      className={cn(
        "group rounded-2xl border bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900",
        href && "cursor-pointer",
      )}
      style={animationDelay ? { animationDelay } : undefined}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="font-semibold text-gray-400 text-xs uppercase tracking-wide">
          {title}
        </p>
        <div
          className={cn(
            "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
            styles.icon,
          )}
        >
          <Icon className={cn("h-4 w-4", styles.iconColor)} />
        </div>
      </div>
      <p className="font-black text-3xl text-gray-900 tracking-tight dark:text-white">
        {value}
      </p>
      {hint ? <p className="mt-1 text-gray-400 text-xs">{hint}</p> : null}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ActivityTableCard({
  title,
  subtitle,
  badge,
  children,
  className,
}: {
  title: string;
  subtitle: string;
  badge: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm sm:rounded-3xl",
        className,
      )}
    >
      <div className="flex flex-col gap-3 border-b border-border/60 bg-muted/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          {badge}
        </span>
      </div>
      <div className="overflow-x-auto px-4 py-4 sm:px-6">{children}</div>
    </div>
  );
}

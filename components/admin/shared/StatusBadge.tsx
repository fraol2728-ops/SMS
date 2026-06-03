import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusClassMap: Record<string, string> = {
  ACTIVE:
    "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-400",
  COMPLETED: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400",
  DROPPED: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400",
  ON_HOLD:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-400",
  PAID: "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-400",
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-400",
  OVERDUE: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400",
  CANCELLED:
    "bg-zinc-100 text-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-300",
  PRESENT:
    "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-400",
  ABSENT: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400",
  LATE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-400",
  EXCUSED: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400",
  UNREAD:
    "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-400",
  READ: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-300",
  REPLIED:
    "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-400",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      className={cn(
        "border-0",
        statusClassMap[status] ?? "bg-zinc-100 text-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-300",
      )}
    >
      {status.replaceAll("_", " ")}
    </Badge>
  );
}

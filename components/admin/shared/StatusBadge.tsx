import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusClassMap: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  DROPPED: "bg-red-100 text-red-700",
  ON_HOLD: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  OVERDUE: "bg-red-100 text-red-700",
  CANCELLED: "bg-zinc-100 text-zinc-700",
  PRESENT: "bg-green-100 text-green-700",
  ABSENT: "bg-red-100 text-red-700",
  LATE: "bg-yellow-100 text-yellow-700",
  EXCUSED: "bg-blue-100 text-blue-700",
  UNREAD: "bg-purple-100 text-purple-700",
  READ: "bg-zinc-100 text-zinc-700",
  REPLIED: "bg-green-100 text-green-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={cn("border-0", statusClassMap[status] ?? "bg-zinc-100 text-zinc-700")}>
      {status.replaceAll("_", " ")}
    </Badge>
  );
}

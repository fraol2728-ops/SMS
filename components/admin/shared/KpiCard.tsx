import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const colorMap = {
  blue: "bg-blue-100 text-blue-700",
  green: "bg-green-100 text-green-700",
  amber: "bg-amber-100 text-amber-700",
  purple: "bg-purple-100 text-purple-700",
} as const;

export function KpiCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: "blue" | "green" | "amber" | "purple";
}) {
  return (
    <Card className="bg-white dark:bg-gray-900 dark:border-gray-700">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <div className={cn("rounded-md p-2", colorMap[color])}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

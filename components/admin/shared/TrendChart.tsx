import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TrendPoint } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

function buildPath(points: TrendPoint[]) {
  if (points.length === 0) return "";

  const max = Math.max(...points.map((point) => point.value), 1);
  const coords = points.map((point, index) => {
    const x = points.length === 1 ? 50 : (index / (points.length - 1)) * 100;
    const y = 70 - (point.value / max) * 50;
    return { x, y };
  });

  return coords
    .map((coord, index) => `${index === 0 ? "M" : "L"} ${coord.x} ${coord.y}`)
    .join(" ");
}

export function TrendChart({
  title,
  subtitle,
  value,
  data,
  accent,
  className,
}: {
  title: string;
  subtitle: string;
  value: string | number;
  data: TrendPoint[];
  accent: string;
  className?: string;
}) {
  const linePath = buildPath(data);
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const id = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-gradient`;

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-2xl border bg-white p-5 shadow-none transition-shadow duration-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900",
        className,
      )}
    >
      <CardHeader className="p-0 pb-4">
        <div className="mb-1 flex items-center justify-between gap-3">
          <div>
            <CardTitle className="font-bold text-gray-900 text-sm dark:text-white">
              {title}
            </CardTitle>
            <CardDescription className="text-gray-400 text-xs">
              {subtitle}
            </CardDescription>
          </div>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-500 text-xs dark:bg-gray-800 dark:text-gray-400">
            Peak {maxValue.toLocaleString()}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-0">
        <div>
          <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {value}
          </p>
          <p className="text-sm text-muted-foreground">
            {total.toLocaleString()} total in period
          </p>
        </div>
        <div className="relative h-44 w-full rounded-xl bg-muted/20 p-2 sm:h-52">
          {[20, 40, 60].map((y) => (
            <div
              key={y}
              className="absolute right-0 left-0 border-border/40 border-t"
              style={{ top: `${y}%` }}
            />
          ))}
          <svg
            aria-hidden="true"
            viewBox="0 0 100 80"
            className="relative h-full w-full"
          >
            <defs>
              <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity="0.4" />
                <stop offset="100%" stopColor={accent} stopOpacity="0" />
              </linearGradient>
            </defs>
            {linePath ? (
              <>
                <path
                  d={`${linePath} L 100 70 L 0 70 Z`}
                  fill={`url(#${id})`}
                  stroke="none"
                />
                <path
                  d={linePath}
                  fill="none"
                  stroke={accent}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {data.map((point, index) => {
                  const x =
                    data.length === 1 ? 50 : (index / (data.length - 1)) * 100;
                  const y = 70 - (point.value / maxValue) * 50;
                  return (
                    <circle
                      key={`${point.label}-${index}`}
                      cx={x}
                      cy={y}
                      r="2.2"
                      fill={accent}
                      className="drop-shadow-sm"
                    />
                  );
                })}
              </>
            ) : (
              <text
                x="50"
                y="40"
                textAnchor="middle"
                className="fill-muted-foreground text-[6px]"
              >
                No data yet
              </text>
            )}
          </svg>
        </div>
        <div className="grid grid-cols-4 gap-1 text-[10px] text-muted-foreground sm:grid-cols-6 sm:text-[11px]">
          {data.map((item, index) => (
            <span
              key={`${item.label}-${index}`}
              className="truncate text-center"
            >
              {item.label}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

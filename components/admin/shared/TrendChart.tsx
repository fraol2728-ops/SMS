import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { TrendPoint } from "@/lib/dashboard";

function buildPath(points: TrendPoint[]) {
  if (points.length === 0) return "";

  const max = Math.max(...points.map((point) => point.value), 1);
  const coords = points.map((point, index) => {
    const x = (index / (points.length - 1)) * 100;
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
}: {
  title: string;
  subtitle: string;
  value: string | number;
  data: TrendPoint[];
  accent: string;
}) {
  const linePath = buildPath(data);
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const id = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-gradient`;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-3xl font-semibold">{value}</p>
            <p className="text-sm text-muted-foreground">
              {data.reduce((sum, item) => sum + item.value, 0)} total
            </p>
          </div>
          <div className="rounded-2xl bg-slate-950/5 px-3 py-2 text-xs font-medium text-slate-700 dark:bg-slate-50/10 dark:text-slate-100">
            Peak {maxValue.toLocaleString()}
          </div>
        </div>
        <div className="h-52 w-full">
          <svg viewBox="0 0 100 80" className="h-full w-full">
            <defs>
              <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
                <stop offset="100%" stopColor={accent} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={`${linePath} L 100 70 L 0 70 Z`}
              fill={`url(#${id})`}
              stroke="none"
            />
            <path
              d={linePath}
              fill="none"
              stroke={accent}
              strokeWidth="2"
              strokeLinecap="round"
            />
            {data.map((point, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = 70 - (point.value / maxValue) * 50;
              return (
                <circle
                  key={point.label}
                  cx={x}
                  cy={y}
                  r="1.8"
                  fill={accent}
                />
              );
            })}
          </svg>
        </div>
        <div className="grid grid-cols-4 gap-2 text-[11px] text-muted-foreground sm:grid-cols-6">
          {data.map((item, index) => (
            <span key={`${item.label}-${index}`} className="truncate text-center">
              {item.label}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

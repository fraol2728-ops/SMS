export type TrendPoint = {
  label: string;
  value: number;
};

export function formatDateKey(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized.toISOString().slice(0, 10);
}

export function formatDayLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function buildTrendSeries<T>(
  items: T[],
  days: number,
  getDate: (item: T) => Date,
  getValue: (item: T) => number,
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(today.getDate() - (days - 1));

  const points: TrendPoint[] = Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      label: formatDayLabel(date),
      value: 0,
    };
  });

  const pointMap = new Map(points.map((item) => [item.label, item]));

  for (const item of items) {
    const itemDate = getDate(item);
    const key = formatDayLabel(itemDate);
    const point = pointMap.get(key);
    if (point) {
      point.value += getValue(item);
    }
  }

  return points;
}

import type { TeacherPerformance } from "@/lib/actions/performance";

const styles = {
  green:
    "bg-green-50 text-green-700 ring-green-200 dark:bg-green-900/30 dark:text-green-300 dark:ring-green-800",
  blue: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-800",
  amber:
    "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800",
  red: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-800",
};

export function PerformanceBadge({
  performance,
}: {
  performance: TeacherPerformance | null;
}) {
  if (!performance?.hasData)
    return (
      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700">
        No data
      </span>
    );
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${styles[performance.gradeColor]}`}
    >
      {performance.totalScore}% · {performance.grade}
    </span>
  );
}

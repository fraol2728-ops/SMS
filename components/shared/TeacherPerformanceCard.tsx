"use client";

import { useEffect, useMemo, useState } from "react";
import type { TeacherPerformance } from "@/lib/actions/performance";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);
    const listener = () => setReduced(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);
  return reduced;
}

function ScoreCircle({ score, size = 132 }: { score: number; size?: number }) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? score : 0);
  const radius = (size - 14) / 2;
  const circumference = 2 * Math.PI * radius;
  useEffect(() => {
    if (reduced) {
      setDisplay(score);
      return;
    }
    let frame = 0;
    let raf = 0;
    const tick = () => {
      frame += 1;
      setDisplay(Math.round((score * frame) / 45));
      if (frame < 45) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced, score]);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg aria-hidden="true" className="-rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="10"
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          className="text-purple-500 transition-[stroke-dashoffset] duration-1000 ease-out"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (circumference * score) / 100}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-black text-gray-900 dark:text-white">
          {display}
        </span>
      </div>
    </div>
  );
}

function AnimatedBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const reduced = useReducedMotion();
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const [width, setWidth] = useState(reduced ? pct : 0);
  useEffect(() => {
    setWidth(reduced ? pct : 0);
    const t = setTimeout(() => setWidth(pct), 50);
    return () => clearTimeout(t);
  }, [pct, reduced]);
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium text-gray-600 dark:text-gray-300">
          {label}
        </span>
        <span className="font-bold text-gray-900 dark:text-white">
          {value}/{max}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export function TeacherPerformanceCard({
  performance,
  compact = false,
}: {
  performance: TeacherPerformance;
  compact?: boolean;
}) {
  const bars = useMemo(
    () => [
      [
        "Feedback rating",
        performance.components.feedbackRating.score,
        40,
        "bg-green-500",
      ] as const,
      [
        "Positive feedback",
        performance.components.positiveFeedback.score,
        30,
        "bg-blue-500",
      ] as const,
      [
        "Attendance",
        performance.components.attendance.score,
        20,
        "bg-amber-500",
      ] as const,
      [
        "Retention",
        performance.components.retention.score,
        10,
        "bg-purple-500",
      ] as const,
    ],
    [performance],
  );
  if (!performance.hasData)
    return (
      <div className="rounded-3xl border bg-white p-6 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <p className="text-4xl">📊</p>
        <h3 className="mt-3 font-bold text-gray-900 dark:text-white">
          No performance data yet
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Student feedback is needed before a teacher score can be calculated.
        </p>
      </div>
    );
  if (compact)
    return (
      <div className="flex items-center gap-3">
        <ScoreCircle score={performance.totalScore} size={72} />
        <div className="min-w-0 flex-1">
          <p className="font-black text-gray-900 dark:text-white">
            {performance.grade}
          </p>
          <div className="mt-2 space-y-1">
            {bars.map(([l, v, m, c]) => (
              <AnimatedBar key={l} label={l} value={v} max={m} color={c} />
            ))}
          </div>
        </div>
      </div>
    );
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        <ScoreCircle score={performance.totalScore} />
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-purple-500">
            Teacher Performance
          </p>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">
            {performance.grade}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Based on {performance.totalFeedbackCount} feedback submissions,
            attendance, and retention.
          </p>
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {bars.map(([l, v, m, c]) => (
          <AnimatedBar key={l} label={l} value={v} max={m} color={c} />
        ))}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Students" value={performance.totalStudents} />
        <Stat label="Classes" value={performance.totalClasses} />
        <Stat
          label="Avg rating"
          value={`${performance.components.feedbackRating.avgRating}/5`}
        />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Insight
          title="Top positives"
          items={performance.components.positiveFeedback.topPositives}
        />
        <Insight
          title="Needs attention"
          items={performance.components.positiveFeedback.topNegatives}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800">
      <p className="text-xs font-semibold uppercase text-gray-400">{label}</p>
      <p className="mt-1 text-xl font-black text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}
function Insight({
  title,
  items,
}: {
  title: string;
  items: { label: string; count: number }[];
}) {
  return (
    <div>
      <p className="mb-2 font-bold text-gray-900 dark:text-white">{title}</p>
      {items.length ? (
        <div className="space-y-2">
          {items.map((i) => (
            <div
              key={i.label}
              className="flex justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800"
            >
              <span>{i.label}</span>
              <b>{i.count}</b>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">No entries yet</p>
      )}
    </div>
  );
}

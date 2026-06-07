"use client";

import { AlertTriangle, BookOpen, MessageSquare, User } from "lucide-react";
import type { ComponentType, FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitFeedback } from "@/lib/actions/feedback";
import { StarRating } from "./StarRating";

const CLASS_OPTIONS = [
  "Very engaging and interactive",
  "Well structured and easy to follow",
  "Content was relevant and useful",
  "Pace was too fast",
  "Pace was too slow",
  "I learned something new today",
  "Could be more practical/hands-on",
  "Needs more examples",
];

const TEACHER_OPTIONS = [
  "Explains clearly and patiently",
  "Always available to answer questions",
  "Makes the class enjoyable",
  "Arrives on time",
  "Gives helpful feedback on my work",
  "Needs to slow down",
  "Needs to give more attention to students",
  "Sometimes hard to understand",
];

const PROBLEM_OPTIONS = [
  "Network / Internet not working",
  "Computer not working properly",
  "Power issue in the lab",
  "Projector / screen not working",
  "Lab is too noisy",
  "Lab is too hot / cold",
  "Not enough chairs or desks",
  "Classroom is not clean",
  "Software not installed / not working",
];

export interface ExistingFeedback {
  classFeedback: string[];
  teacherFeedback: string[];
  problemsReported: string[];
  comment: string | null;
  rating: number | null;
  ratedAt: Date | string | null;
  lastSubmittedAt: Date | string | null;
}

interface FeedbackFormProps {
  enrollmentId: string;
  classId: string;
  existingFeedback?: ExistingFeedback | null;
  onSuccess?: () => void;
  compact?: boolean;
  fromModal?: boolean;
}

type SectionIcon = ComponentType<{ size?: number; className?: string }>;

export function FeedbackForm({
  enrollmentId,
  classId,
  existingFeedback,
  onSuccess,
  compact = false,
  fromModal = false,
}: FeedbackFormProps) {
  const alreadyRated = existingFeedback?.rating != null;

  const [classFeedback, setClassFeedback] = useState<string[]>(
    existingFeedback?.classFeedback ?? [],
  );
  const [teacherFeedback, setTeacherFeedback] = useState<string[]>(
    existingFeedback?.teacherFeedback ?? [],
  );
  const [problems, setProblems] = useState<string[]>(
    existingFeedback?.problemsReported ?? [],
  );
  const [comment, setComment] = useState(existingFeedback?.comment ?? "");
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);

  function toggle(arr: string[], setArr: (v: string[]) => void, val: string) {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  const CheckOption = ({
    label,
    checked,
    onToggle,
    danger = false,
  }: {
    label: string;
    checked: boolean;
    onToggle: () => void;
    danger?: boolean;
  }) => (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left font-medium text-sm transition-all ${
        checked
          ? danger
            ? "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
            : "border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
          : "border-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600"
      }`}
    >
      <span
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
          checked
            ? danger
              ? "border-amber-500 bg-amber-500"
              : "border-blue-500 bg-blue-500"
            : "border-gray-300 dark:border-gray-600"
        }`}
      >
        {checked && <span className="font-bold text-white text-xs">✓</span>}
      </span>
      {label}
    </button>
  );

  const SectionHeader = ({
    icon: Icon,
    title,
    color,
  }: {
    icon: SectionIcon;
    title: string;
    color: string;
  }) => (
    <div className="mb-3 flex items-center gap-3">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-2xl ${color}`}
      >
        <Icon size={17} className="text-white" />
      </div>
      <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
    </div>
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!alreadyRated && rating === 0) {
      toast.error("Please rate your overall experience");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("enrollmentId", enrollmentId);
      formData.set("classId", classId);
      formData.set("classFeedback", classFeedback.join("||"));
      formData.set("teacherFeedback", teacherFeedback.join("||"));
      formData.set("problemsReported", problems.join("||"));
      formData.set("comment", comment);
      formData.set("fromModal", String(fromModal));
      if (!alreadyRated && rating > 0) {
        formData.set("rating", String(rating));
      }

      const res = await submitFeedback(formData);
      if (res.success) {
        toast.success(
          existingFeedback
            ? "Feedback updated! 🙏"
            : "Feedback submitted! Thank you 🙏",
        );
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <SectionHeader
          icon={BookOpen}
          title="How was the class?"
          color="bg-blue-500"
        />
        <div
          className={`grid gap-2 ${compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}
        >
          {CLASS_OPTIONS.map((opt) => (
            <CheckOption
              key={opt}
              label={opt}
              checked={classFeedback.includes(opt)}
              onToggle={() => toggle(classFeedback, setClassFeedback, opt)}
            />
          ))}
        </div>
      </div>

      <div>
        <SectionHeader
          icon={User}
          title="How was your teacher?"
          color="bg-green-500"
        />
        <div
          className={`grid gap-2 ${compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}
        >
          {TEACHER_OPTIONS.map((opt) => (
            <CheckOption
              key={opt}
              label={opt}
              checked={teacherFeedback.includes(opt)}
              onToggle={() => toggle(teacherFeedback, setTeacherFeedback, opt)}
            />
          ))}
        </div>
      </div>

      <div>
        <SectionHeader
          icon={AlertTriangle}
          title="Report a problem"
          color="bg-amber-500"
        />
        <div
          className={`grid gap-2 ${compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}
        >
          {PROBLEM_OPTIONS.map((opt) => (
            <CheckOption
              key={opt}
              label={opt}
              checked={problems.includes(opt)}
              onToggle={() => toggle(problems, setProblems, opt)}
              danger
            />
          ))}
        </div>
      </div>

      <div>
        <SectionHeader
          icon={MessageSquare}
          title="Your thoughts"
          color="bg-purple-500"
        />
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Write your thoughts, suggestions, or concerns..."
          className="rounded-2xl"
        />
      </div>

      {alreadyRated ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <p className="font-medium text-amber-800 text-sm dark:text-amber-300">
            You rated this class {"★".repeat(existingFeedback.rating ?? 0)}
            {"☆".repeat(5 - (existingFeedback.rating ?? 0))} (
            {existingFeedback.rating}/5) — Thank you! ✨
          </p>
          <p className="mt-1 text-amber-600 text-xs dark:text-amber-400">
            Ratings cannot be changed after submission.
          </p>
        </div>
      ) : (
        <div>
          <SectionHeader
            icon={({ className }) => (
              <span className={`text-lg ${className}`}>★</span>
            )}
            title="Rate your overall experience"
            color="bg-amber-500"
          />
          <StarRating value={rating} onChange={setRating} />
          {rating === 0 && (
            <p className="mt-2 text-gray-400 text-xs">
              Required — please select a rating
            </p>
          )}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
        size="lg"
      >
        {loading
          ? "Submitting..."
          : existingFeedback
            ? "Update Feedback"
            : "Submit Feedback"}
      </Button>
    </form>
  );
}

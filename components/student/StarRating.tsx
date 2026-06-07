"use client";

import { useState } from "react";

const STAR_LABELS = ["Poor", "Fair", "Good", "Great", "Excellent"];

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  readonly?: boolean;
}

export function StarRating({ value, onChange, readonly }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            className={`text-4xl transition-all duration-150 ${
              readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
            } ${star <= display ? "text-amber-400" : "text-gray-200 dark:text-gray-700"}`}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
          >
            ★
          </button>
        ))}
        {display > 0 && (
          <span className="ml-1 font-medium text-gray-600 text-sm dark:text-gray-400">
            {STAR_LABELS[display - 1]}
          </span>
        )}
      </div>
    </div>
  );
}

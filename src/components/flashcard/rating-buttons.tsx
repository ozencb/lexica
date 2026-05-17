"use client";

import { previewIntervals, type SM2Input, type Quality } from "@/lib/sm2";

type RatingButtonsProps = {
  prev: SM2Input;
  onRate: (quality: Quality) => void;
  disabled?: boolean;
};

const RATINGS: { quality: Quality; label: string; key: string; color: string }[] = [
  { quality: 1, label: "Again", key: "1", color: "text-red-400 border-red-400/20 hover:bg-red-400/10" },
  { quality: 2, label: "Hard", key: "2", color: "text-amber-400 border-amber-400/20 hover:bg-amber-400/10" },
  { quality: 3, label: "Good", key: "3", color: "text-emerald-400 border-emerald-400/20 hover:bg-emerald-400/10" },
  { quality: 4, label: "Easy", key: "4", color: "text-sky-400 border-sky-400/20 hover:bg-sky-400/10" },
];

export function RatingButtons({ prev, onRate, disabled }: RatingButtonsProps) {
  const intervals = previewIntervals(prev);

  return (
    <div className="flex gap-1.5 w-full max-w-md mx-auto">
      {RATINGS.map(({ quality, label, key, color }) => (
        <button
          key={quality}
          type="button"
          onClick={() => onRate(quality)}
          disabled={disabled}
          aria-label={`Rate ${label} - next review in ${intervals[quality]}`}
          className={`flex-1 py-2.5 px-2 rounded-lg border text-center transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${color}`}
        >
          <div className="font-medium text-xs">{label}</div>
          <div className="text-[10px] opacity-50 mt-0.5">{intervals[quality]}</div>
          <div className="text-[9px] opacity-25 mt-0.5 font-mono">{key}</div>
        </button>
      ))}
    </div>
  );
}

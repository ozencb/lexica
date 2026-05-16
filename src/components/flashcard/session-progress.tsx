"use client";

type SessionProgressProps = {
  reviewed: number;
  total: number;
  correct: number;
  again: number;
};

export function SessionProgress({
  reviewed,
  total,
  correct,
  again,
}: SessionProgressProps) {
  const pct = total > 0 ? (reviewed / total) * 100 : 0;

  return (
    <div className="w-full max-w-md mx-auto space-y-2.5">
      <div className="flex justify-between text-[13px]">
        <span className="text-muted-foreground tabular-nums">
          {reviewed} / {total}
        </span>
        <div className="flex gap-3">
          <span className="text-emerald-400 tabular-nums">{correct} correct</span>
          <span className="text-red-400 tabular-nums">{again} again</span>
        </div>
      </div>
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

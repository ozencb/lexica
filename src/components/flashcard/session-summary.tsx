"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

type SessionSummaryProps = {
  reviewed: number;
  correct: number;
  again: number;
  onRestart: () => void;
};

export function SessionSummary({
  reviewed,
  correct,
  again,
  onRestart,
}: SessionSummaryProps) {
  const accuracy = reviewed > 0 ? Math.round((correct / reviewed) * 100) : 0;

  return (
    <div className="w-full max-w-sm mx-auto rounded-lg border border-border/60 bg-card p-6">
      <h2 className="text-sm font-semibold text-center mb-5">Session Complete</h2>
      <div className="grid grid-cols-3 gap-4 text-center mb-5">
        <div>
          <div className="text-xl font-semibold tabular-nums">{reviewed}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Reviewed</div>
        </div>
        <div>
          <div className="text-xl font-semibold tabular-nums text-emerald-400">{accuracy}%</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Accuracy</div>
        </div>
        <div>
          <div className="text-xl font-semibold tabular-nums text-red-400">{again}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Again</div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={onRestart} variant="outline" size="sm" className="flex-1">
          Study More
        </Button>
        <Link
          href="/table"
          className="flex-1 inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-medium h-7 px-2.5 hover:bg-primary/80 transition-colors"
        >
          Back to Table
        </Link>
      </div>
    </div>
  );
}

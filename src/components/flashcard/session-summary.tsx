"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Session Complete</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold tabular-nums">{reviewed}</div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wide mt-0.5">Reviewed</div>
          </div>
          <div>
            <div className="text-2xl font-bold tabular-nums text-emerald-400">{accuracy}%</div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wide mt-0.5">Accuracy</div>
          </div>
          <div>
            <div className="text-2xl font-bold tabular-nums text-red-400">{again}</div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wide mt-0.5">Again</div>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button onClick={onRestart} variant="outline" className="flex-1">
            Study More
          </Button>
          <Link
            href="/table"
            className="flex-1 inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium h-8 px-2.5 hover:bg-primary/80 transition-colors"
          >
            Back to Table
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

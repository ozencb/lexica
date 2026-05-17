"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { StatsCards } from "@/components/progress/stats-cards";
import { AccuracyChart } from "@/components/progress/accuracy-chart";

export default function ProgressPage() {
  const { data: stats } = useSWR<{
    learned: number;
    inProgress: number;
    unseen: number;
    dueToday: number;
    streak: number;
  }>("/api/progress/stats", fetcher);
  const { data: history } = useSWR<
    { date: string; total: number; correct: number; accuracy: number }[]
  >("/api/progress/history?days=30", fetcher);

  return (
    <div className="p-4 md:p-6 pt-14 md:pt-6 space-y-5">
      <h1 className="text-lg font-semibold tracking-tight">Progress</h1>

      {stats && (
        <StatsCards
          learned={stats.learned}
          inProgress={stats.inProgress}
          unseen={stats.unseen}
          dueToday={stats.dueToday}
          streak={stats.streak}
        />
      )}

      {history && <AccuracyChart data={history} />}
    </div>
  );
}

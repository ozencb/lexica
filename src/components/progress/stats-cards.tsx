"use client";

import { BookOpen, Brain, Eye, Calendar, Flame } from "lucide-react";

type StatsCardsProps = {
  learned: number;
  inProgress: number;
  unseen: number;
  dueToday: number;
  streak: number;
};

export function StatsCards({
  learned,
  inProgress,
  unseen,
  dueToday,
  streak,
}: StatsCardsProps) {
  const stats = [
    { label: "Learned", value: learned, icon: Brain, color: "text-emerald-400" },
    { label: "In Progress", value: inProgress, icon: BookOpen, color: "text-amber-400" },
    { label: "Unseen", value: unseen, icon: Eye, color: "text-muted-foreground" },
    { label: "Due Today", value: dueToday, icon: Calendar, color: "text-primary" },
    { label: "Streak", value: `${streak}d`, icon: Flame, color: "text-orange-400" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-border/60 p-3 bg-card"
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
            <span className="text-[11px] text-muted-foreground font-medium">{stat.label}</span>
          </div>
          <div className="text-xl font-semibold tracking-tight tabular-nums">{stat.value}</div>
        </div>
      ))}
    </div>
  );
}

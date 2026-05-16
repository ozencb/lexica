"use client";

import { Card, CardContent } from "@/components/ui/card";
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
    { label: "Learned", value: learned, icon: Brain, color: "text-emerald-400", bg: "bg-emerald-400/8" },
    { label: "In Progress", value: inProgress, icon: BookOpen, color: "text-amber-400", bg: "bg-amber-400/8" },
    { label: "Unseen", value: unseen, icon: Eye, color: "text-muted-foreground", bg: "bg-muted-foreground/8" },
    { label: "Due Today", value: dueToday, icon: Calendar, color: "text-sky-400", bg: "bg-sky-400/8" },
    { label: "Streak", value: `${streak}d`, icon: Flame, color: "text-orange-400", bg: "bg-orange-400/8" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-md ${stat.bg}`}>
                <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
              </div>
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

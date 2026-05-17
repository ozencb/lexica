"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type HistoryEntry = {
  date: string;
  total: number;
  correct: number;
  accuracy: number;
};

type AccuracyChartProps = {
  data: HistoryEntry[];
};

export function AccuracyChart({ data }: AccuracyChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border/60 p-4 bg-card">
        <h3 className="text-sm font-medium mb-2">Accuracy Over Time</h3>
        <p className="text-xs text-muted-foreground">
          No study history yet. Start reviewing flashcards to see your progress.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/60 p-4 bg-card">
      <h3 className="text-sm font-medium mb-4">Accuracy Over Time</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} />
          <XAxis
            dataKey="date"
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
            tickFormatter={(v) => v.slice(5)}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
            tickFormatter={(v) => `${v}%`}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 11,
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
            formatter={(value) => [`${value}%`, "Accuracy"]}
          />
          <Line
            type="monotone"
            dataKey="accuracy"
            stroke="var(--color-primary)"
            strokeWidth={1.5}
            dot={{ r: 2, fill: "var(--color-primary)" }}
            activeDot={{ r: 3.5, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

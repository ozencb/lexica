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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accuracy Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No study history yet. Start reviewing flashcards to see your progress.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Accuracy Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
              tickFormatter={(v) => v.slice(5)}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
              tickFormatter={(v) => `${v}%`}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 10,
                fontSize: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
              formatter={(value) => [`${value}%`, "Accuracy"]}
            />
            <Line
              type="monotone"
              dataKey="accuracy"
              stroke="var(--color-primary)"
              strokeWidth={2}
              dot={{ r: 2.5, fill: "var(--color-primary)" }}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

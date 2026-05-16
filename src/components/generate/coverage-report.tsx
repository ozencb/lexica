"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface CoverageReportProps {
  total: number;
  complete: number;
  translationOnly: number;
  noTranslation: number;
}

export function CoverageReport({
  total,
  complete,
  translationOnly,
  noTranslation,
}: CoverageReportProps) {
  const stats = [
    {
      label: "Complete",
      value: complete,
      description: "Word + translation + sentence",
      color: "text-green-500",
    },
    {
      label: "Translation Only",
      value: translationOnly,
      description: "Word + translation, no sentence",
      color: "text-yellow-500",
    },
    {
      label: "No Translation",
      value: noTranslation,
      description: "Word only, no data found",
      color: "text-red-500",
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Processed {total.toLocaleString()} words from frequency list
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} size="sm">
            <CardHeader>
              <CardTitle className={stat.color}>{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.value.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

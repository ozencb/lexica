import { db } from "@/lib/db";
import { studyProgress } from "@/lib/db/schema";
import { sql, and, isNotNull, gte } from "drizzle-orm";
import { NextRequest } from "next/server";
import { progressHistoryQuerySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = progressHistoryQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { days } = parsed.data;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      day: sql<string>`DATE(${studyProgress.lastReviewedAt}, 'unixepoch')`,
      total: sql<number>`COUNT(*)`,
      correct: sql<number>`SUM(CASE WHEN ${studyProgress.repetitions} > 0 THEN 1 ELSE 0 END)`,
    })
    .from(studyProgress)
    .where(
      and(
        isNotNull(studyProgress.lastReviewedAt),
        gte(studyProgress.lastReviewedAt, since)
      )
    )
    .groupBy(sql`DATE(${studyProgress.lastReviewedAt}, 'unixepoch')`)
    .orderBy(sql`DATE(${studyProgress.lastReviewedAt}, 'unixepoch') ASC`);

  const history = rows.map((row) => ({
    date: row.day,
    total: row.total,
    correct: row.correct,
    accuracy: row.total > 0 ? Math.round((row.correct / row.total) * 100) : 0,
  }));

  return Response.json(history);
}

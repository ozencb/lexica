import { db } from "@/lib/db";
import { words, studyProgress } from "@/lib/db/schema";
import { eq, gt, lte, and, isNull, isNotNull, sql, count } from "drizzle-orm";

export async function GET() {
  const now = new Date();

  const [learned] = await db
    .select({ count: count() })
    .from(studyProgress)
    .where(gt(studyProgress.intervalDays, 21));

  const [inProgress] = await db
    .select({ count: count() })
    .from(studyProgress)
    .where(
      and(
        gt(studyProgress.repetitions, 0),
        lte(studyProgress.intervalDays, 21)
      )
    );

  const [totalWords] = await db
    .select({ count: count() })
    .from(words);

  const [withProgress] = await db
    .select({ count: count() })
    .from(studyProgress);

  const unseen = totalWords.count - withProgress.count;

  const [due] = await db
    .select({ count: count() })
    .from(studyProgress)
    .where(lte(studyProgress.nextReviewAt, now));

  const [newCards] = await db
    .select({ count: count() })
    .from(words)
    .leftJoin(studyProgress, eq(words.id, studyProgress.wordId))
    .where(isNull(studyProgress.id));

  const streak = await computeStreak();

  return Response.json({
    learned: learned.count,
    inProgress: inProgress.count,
    unseen,
    dueToday: due.count + newCards.count,
    totalWords: totalWords.count,
    streak,
  });
}

async function computeStreak(): Promise<number> {
  const rows = await db
    .select({
      day: sql<string>`DATE(${studyProgress.lastReviewedAt}, 'unixepoch')`,
    })
    .from(studyProgress)
    .where(isNotNull(studyProgress.lastReviewedAt))
    .groupBy(sql`DATE(${studyProgress.lastReviewedAt} / 1000, 'unixepoch')`)
    .orderBy(sql`DATE(${studyProgress.lastReviewedAt} / 1000, 'unixepoch') DESC`);

  if (rows.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < rows.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().split("T")[0];

    if (rows[i].day === expectedStr) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

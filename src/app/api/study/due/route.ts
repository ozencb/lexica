import { db } from "@/lib/db";
import { words, studyProgress } from "@/lib/db/schema";
import { eq, and, lte, isNull, or, asc, sql } from "drizzle-orm";
import { NextRequest } from "next/server";
import { studyDueQuerySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = studyDueQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { wordSetId, pos, limit } = parsed.data;

  const now = new Date();

  const conditions = [eq(words.wordSetId, wordSetId)];
  if (pos && pos !== "all") {
    conditions.push(eq(words.partOfSpeech, pos));
  }

  const results = await db
    .select({
      id: words.id,
      learningWord: words.learningWord,
      nativeWord: words.nativeWord,
      learningSentence: words.learningSentence,
      nativeSentence: words.nativeSentence,
      partOfSpeech: words.partOfSpeech,
      frequencyRank: words.frequencyRank,
      wordSetId: words.wordSetId,
      easeFactor: studyProgress.easeFactor,
      intervalDays: studyProgress.intervalDays,
      repetitions: studyProgress.repetitions,
      nextReviewAt: studyProgress.nextReviewAt,
    })
    .from(words)
    .leftJoin(studyProgress, eq(words.id, studyProgress.wordId))
    .where(
      and(
        ...conditions,
        or(isNull(studyProgress.nextReviewAt), lte(studyProgress.nextReviewAt, now))
      )
    )
    .orderBy(
      sql`CASE WHEN ${studyProgress.nextReviewAt} IS NULL THEN 1 ELSE 0 END`,
      asc(studyProgress.nextReviewAt),
      asc(words.frequencyRank)
    )
    .limit(limit);

  return Response.json(results);
}

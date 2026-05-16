import { db } from "@/lib/db";
import { studyProgress } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sm2, type Quality } from "@/lib/sm2";
import { NextRequest } from "next/server";
import { studyReviewBodySchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = studyReviewBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { wordId, quality } = parsed.data as { wordId: string; quality: Quality };

  const [existing] = await db
    .select()
    .from(studyProgress)
    .where(eq(studyProgress.wordId, wordId));

  const prev = existing
    ? {
        easeFactor: existing.easeFactor,
        intervalDays: existing.intervalDays,
        repetitions: existing.repetitions,
      }
    : { easeFactor: 2.5, intervalDays: 0, repetitions: 0 };

  const result = sm2(quality, prev);
  const now = new Date();

  if (existing) {
    await db
      .update(studyProgress)
      .set({
        easeFactor: result.easeFactor,
        intervalDays: result.intervalDays,
        repetitions: result.repetitions,
        nextReviewAt: result.nextReviewAt,
        lastReviewedAt: now,
      })
      .where(eq(studyProgress.id, existing.id));
  } else {
    await db.insert(studyProgress).values({
      wordId,
      easeFactor: result.easeFactor,
      intervalDays: result.intervalDays,
      repetitions: result.repetitions,
      nextReviewAt: result.nextReviewAt,
      lastReviewedAt: now,
    });
  }

  return Response.json({
    easeFactor: result.easeFactor,
    intervalDays: result.intervalDays,
    repetitions: result.repetitions,
    nextReviewAt: result.nextReviewAt,
  });
}

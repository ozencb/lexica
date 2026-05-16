import { db } from "@/lib/db";
import { wordSets, words } from "@/lib/db/schema";
import { desc, eq, count } from "drizzle-orm";
import { NextRequest } from "next/server";
import { wordSetCreateSchema } from "@/lib/validations";

export async function GET() {
  const sets = await db
    .select({
      id: wordSets.id,
      name: wordSets.name,
      learningLang: wordSets.learningLang,
      nativeLang: wordSets.nativeLang,
      createdAt: wordSets.createdAt,
      wordCount: count(words.id),
    })
    .from(wordSets)
    .leftJoin(words, eq(wordSets.id, words.wordSetId))
    .groupBy(wordSets.id)
    .orderBy(desc(wordSets.createdAt));
  return Response.json(sets);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = wordSetCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const [created] = await db.insert(wordSets).values(parsed.data).returning();

  return Response.json(created, { status: 201 });
}

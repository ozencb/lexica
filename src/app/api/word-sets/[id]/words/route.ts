import { db } from "@/lib/db";
import { words } from "@/lib/db/schema";
import { eq, and, gte, lte, asc, desc, sql, count } from "drizzle-orm";
import { NextRequest } from "next/server";
import { wordsQuerySchema } from "@/lib/validations";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = wordsQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { search, pos, freqMin, freqMax, sort, order, limit, offset } = parsed.data;

  const conditions = [eq(words.wordSetId, id)];

  if (search) {
    conditions.push(
      sql`(${words.learningWord} LIKE ${`%${search}%`} OR ${words.nativeWord} LIKE ${`%${search}%`})`
    );
  }

  if (pos && pos !== "all") {
    conditions.push(eq(words.partOfSpeech, pos));
  }

  conditions.push(gte(words.frequencyRank, freqMin));
  conditions.push(lte(words.frequencyRank, freqMax));

  const sortColumn = sort === "learningWord" ? words.learningWord
    : sort === "nativeWord" ? words.nativeWord
    : words.frequencyRank;

  const orderFn = order === "desc" ? desc : asc;
  const whereClause = and(...conditions);

  const [results, [{ total }]] = await Promise.all([
    db.select().from(words).where(whereClause).orderBy(orderFn(sortColumn)).limit(limit).offset(offset),
    db.select({ total: count() }).from(words).where(whereClause),
  ]);

  return Response.json({ items: results, total, limit, offset });
}

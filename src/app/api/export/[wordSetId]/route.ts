import { db } from "@/lib/db";
import { wordSets, words, studyProgress } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wordSetId: string }> }
) {
  const { wordSetId } = await params;
  const includeProgress =
    request.nextUrl.searchParams.get("includeProgress") === "true";

  const [wordSet] = await db
    .select()
    .from(wordSets)
    .where(eq(wordSets.id, wordSetId));

  if (!wordSet) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const wordRows = await db
    .select()
    .from(words)
    .where(eq(words.wordSetId, wordSetId));

  let progressMap = new Map<
    string,
    { easeFactor: number; intervalDays: number; repetitions: number }
  >();

  if (includeProgress) {
    const progressRows = await db.select().from(studyProgress);
    const wordIds = new Set(wordRows.map((w) => w.id));
    for (const p of progressRows) {
      if (wordIds.has(p.wordId)) {
        progressMap.set(p.wordId, {
          easeFactor: p.easeFactor,
          intervalDays: p.intervalDays,
          repetitions: p.repetitions,
        });
      }
    }
  }

  const headers = [
    "learningWord",
    "nativeWord",
    "learningSentence",
    "nativeSentence",
    "partOfSpeech",
    "frequencyRank",
  ];

  if (includeProgress) {
    headers.push("easeFactor", "intervalDays", "repetitions");
  }

  const csvRows = wordRows.map((w) => {
    const row = [
      csvEscape(w.learningWord),
      csvEscape(w.nativeWord),
      csvEscape(w.learningSentence ?? ""),
      csvEscape(w.nativeSentence ?? ""),
      csvEscape(w.partOfSpeech),
      String(w.frequencyRank),
    ];

    if (includeProgress) {
      const p = progressMap.get(w.id);
      row.push(
        String(p?.easeFactor ?? ""),
        String(p?.intervalDays ?? ""),
        String(p?.repetitions ?? "")
      );
    }

    return row.join(",");
  });

  const csv = [headers.join(","), ...csvRows].join("\n");
  const filename = `${wordSet.name.replace(/[^a-zA-Z0-9_-]/g, "_")}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

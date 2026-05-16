import { db } from "@/lib/db";
import { wordSets, words } from "@/lib/db/schema";
import { parseCSV } from "@/lib/import/csv-parser";
import { csvMappingSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const mappingStr = formData.get("mapping") as string | null;
  const wordSetName = formData.get("wordSetName") as string | null;
  const learningLang = formData.get("learningLang") as string | null;
  const nativeLang = formData.get("nativeLang") as string | null;

  if (!file || !mappingStr || !wordSetName || !learningLang || !nativeLang) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  let raw: unknown;
  try {
    raw = JSON.parse(mappingStr);
  } catch {
    return Response.json({ error: "Invalid mapping JSON" }, { status: 400 });
  }

  const parsed = csvMappingSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const mapping = parsed.data;
  const content = await file.text();
  const { rows } = parseCSV(content);

  if (rows.length === 0) {
    return Response.json({ error: "No data rows found" }, { status: 400 });
  }

  const [wordSet] = await db
    .insert(wordSets)
    .values({ name: wordSetName, learningLang, nativeLang })
    .returning();

  const wordRows = rows.map((row, i) => ({
    wordSetId: wordSet.id,
    learningWord: row[mapping.learningWord] ?? "",
    nativeWord: row[mapping.nativeWord] ?? "",
    learningSentence:
      mapping.learningSentence != null
        ? (row[mapping.learningSentence] ?? null)
        : null,
    nativeSentence:
      mapping.nativeSentence != null
        ? (row[mapping.nativeSentence] ?? null)
        : null,
    partOfSpeech:
      mapping.partOfSpeech != null
        ? (row[mapping.partOfSpeech] ?? "unknown")
        : "unknown",
    frequencyRank: i + 1,
  }));

  // Insert in batches of 500 (SQLite variable limit)
  for (let i = 0; i < wordRows.length; i += 500) {
    await db.insert(words).values(wordRows.slice(i, i + 500));
  }

  return Response.json(wordSet, { status: 201 });
}

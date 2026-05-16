import { db } from "@/lib/db";
import { wordSets, words } from "@/lib/db/schema";
import { parseAnkiPackage } from "@/lib/import/anki-parser";
import { ankiMappingSchema } from "@/lib/validations";

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

  const parsed = ankiMappingSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const mapping = parsed.data;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { notes } = parseAnkiPackage(buffer);

  if (notes.length === 0) {
    return Response.json({ error: "No notes found in package" }, { status: 400 });
  }

  const [wordSet] = await db
    .insert(wordSets)
    .values({ name: wordSetName, learningLang, nativeLang })
    .returning();

  const wordRows = notes.map((note, i) => ({
    wordSetId: wordSet.id,
    learningWord: note.fields[mapping.learningWord] ?? "",
    nativeWord: note.fields[mapping.nativeWord] ?? "",
    learningSentence: mapping.learningSentence
      ? (note.fields[mapping.learningSentence] ?? null)
      : null,
    nativeSentence: mapping.nativeSentence
      ? (note.fields[mapping.nativeSentence] ?? null)
      : null,
    partOfSpeech: mapping.partOfSpeech
      ? (note.fields[mapping.partOfSpeech] ?? "unknown")
      : "unknown",
    frequencyRank: i + 1,
  }));

  for (let i = 0; i < wordRows.length; i += 500) {
    await db.insert(words).values(wordRows.slice(i, i + 500));
  }

  return Response.json(wordSet, { status: 201 });
}

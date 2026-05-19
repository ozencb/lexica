import fs from "fs";
import path from "path";
import { z } from "zod";

const PREDEFINED_SETS_DIR = path.join(process.cwd(), "data/predefined-sets");

const LANG_LABELS: Record<string, string> = {
  en: "English",
  fr: "French",
  es: "Spanish",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  nl: "Dutch",
  tr: "Turkish",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
};

const predefinedWordSchema = z.object({
  learningWord: z.string(),
  nativeWord: z.string(),
  learningSentence: z.string(),
  nativeSentence: z.string(),
  partOfSpeech: z.string(),
  frequencyRank: z.number(),
});

const predefinedSetSchema = z.object({
  metadata: z.object({
    targetLang: z.string(),
    sourceLang: z.string(),
    wordType: z.string(),
    count: z.number(),
    generatedAt: z.string(),
    version: z.number(),
  }),
  words: z.array(predefinedWordSchema),
});

export type PredefinedSet = z.infer<typeof predefinedSetSchema>;
export type PredefinedSetMetadata = PredefinedSet["metadata"];
export type PredefinedWord = z.infer<typeof predefinedWordSchema>;

export function formatSetDisplayName(metadata: PredefinedSetMetadata): string {
  const targetLabel =
    LANG_LABELS[metadata.targetLang] || metadata.targetLang.toUpperCase();
  const typeLabel =
    metadata.wordType.charAt(0).toUpperCase() + metadata.wordType.slice(1);
  return `${targetLabel} ${typeLabel} — Top ${metadata.count}`;
}

export function listPredefinedSets(): Array<{
  filename: string;
  metadata: PredefinedSetMetadata;
  displayName: string;
}> {
  if (!fs.existsSync(PREDEFINED_SETS_DIR)) return [];

  const files = fs
    .readdirSync(PREDEFINED_SETS_DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("."));

  const sets: Array<{
    filename: string;
    metadata: PredefinedSetMetadata;
    displayName: string;
  }> = [];

  for (const file of files) {
    try {
      const raw = JSON.parse(
        fs.readFileSync(path.join(PREDEFINED_SETS_DIR, file), "utf-8")
      );
      const parsed = predefinedSetSchema.safeParse(raw);
      if (!parsed.success) continue;
      sets.push({
        filename: file,
        metadata: parsed.data.metadata,
        displayName: formatSetDisplayName(parsed.data.metadata),
      });
    } catch {
      continue;
    }
  }

  return sets;
}

export function loadPredefinedSet(filename: string): PredefinedSet {
  if (filename.includes("..") || filename.includes("/")) {
    throw new Error("Invalid filename");
  }
  const filePath = path.join(PREDEFINED_SETS_DIR, filename);
  if (!fs.existsSync(filePath)) throw new Error("File not found");
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return predefinedSetSchema.parse(raw);
}

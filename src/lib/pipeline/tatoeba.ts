import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

const CACHE_DIR = path.join(process.cwd(), "data/pipeline-cache/tatoeba");

const LANG_CODES: Record<string, string> = {
  fr: "fra",
  es: "spa",
};

const MAX_SENTENCES_PER_WORD = 20;

export async function fetchTatoebaSentences(
  learningLang: string,
  _nativeLang: string
): Promise<Map<string, Array<{ learningSentence: string; nativeSentence: string }>>> {
  const langCode = LANG_CODES[learningLang];
  if (!langCode) throw new Error(`Unsupported language for Tatoeba: ${learningLang}`);

  const cacheFile = path.join(CACHE_DIR, `${langCode}-eng.zip`);

  if (!fs.existsSync(cacheFile)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    const url = `https://www.manythings.org/anki/${langCode}-eng.zip`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch Tatoeba data: ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(cacheFile, buffer);
  }

  const zip = new AdmZip(cacheFile);
  const entries = zip.getEntries();
  const tsvEntry = entries.find((e) => e.entryName === `${langCode}.txt`) ??
    entries.find((e) => e.entryName.endsWith(".txt") && !e.entryName.startsWith("_"));
  if (!tsvEntry) throw new Error("No TSV file found in zip");

  const content = tsvEntry.getData().toString("utf-8");
  const result = new Map<
    string,
    Array<{ learningSentence: string; nativeSentence: string }>
  >();

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split("\t");
    if (parts.length < 2) continue;
    const englishSentence = parts[0];
    const otherSentence = parts[1];

    const words = otherSentence
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter(Boolean);

    for (const word of words) {
      const existing = result.get(word);
      const entry = { learningSentence: otherSentence, nativeSentence: englishSentence };
      if (existing) {
        if (existing.length < MAX_SENTENCES_PER_WORD) {
          existing.push(entry);
        }
      } else {
        result.set(word, [entry]);
      }
    }
  }

  return result;
}

import fs from "fs";
import path from "path";
import zlib from "zlib";
import readline from "readline";

const CACHE_DIR = path.join(process.cwd(), "data/pipeline-cache/wiktionary");

const LANG_NAMES: Record<string, string> = {
  fr: "French",
  es: "Spanish",
  en: "English",
};

export async function fetchWiktionaryData(
  learningLang: string,
  nativeLang: string
): Promise<Map<string, Array<{ pos: string; translations: string[] }>>> {
  const langName = LANG_NAMES[learningLang];
  if (!langName) throw new Error(`Unsupported language: ${learningLang}`);

  const cacheFile = path.join(CACHE_DIR, `${learningLang}.jsonl.gz`);

  if (!fs.existsSync(cacheFile)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    const url = `https://kaikki.org/dictionary/${langName}/kaikki.org-dictionary-${langName}.jsonl.gz`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch wiktionary data: ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(cacheFile, buffer);
  }

  const result = new Map<string, Array<{ pos: string; translations: string[] }>>();

  const gunzip = zlib.createGunzip();
  const stream = fs.createReadStream(cacheFile).pipe(gunzip);
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);
      const word = entry.word?.toLowerCase();
      const pos = entry.pos;
      if (!word || !pos) continue;

      const translations: string[] = [];

      // Try structured translations first
      if (Array.isArray(entry.translations)) {
        for (const t of entry.translations) {
          if (t.lang_code === nativeLang && t.word) {
            translations.push(t.word);
          }
        }
      }
      if (Array.isArray(entry.senses)) {
        for (const sense of entry.senses) {
          if (Array.isArray(sense.translations)) {
            for (const t of sense.translations) {
              if (t.lang_code === nativeLang && t.word) {
                translations.push(t.word);
              }
            }
          }
        }
      }

      // Fall back to glosses (English definitions from kaikki.org dumps)
      if (translations.length === 0 && nativeLang === "en" && Array.isArray(entry.senses)) {
        for (const sense of entry.senses) {
          if (sense.tags?.includes("form-of")) continue;
          if (Array.isArray(sense.glosses)) {
            const gloss = sense.glosses[sense.glosses.length - 1];
            if (gloss && !gloss.startsWith("inflection of") && !gloss.startsWith("plural of")) {
              translations.push(gloss);
              break;
            }
          }
        }
      }

      if (translations.length > 0) {
        const existing = result.get(word);
        if (existing) {
          const samePosEntry = existing.find((e) => e.pos === pos);
          if (samePosEntry) {
            for (const t of translations) {
              if (!samePosEntry.translations.includes(t)) {
                samePosEntry.translations.push(t);
              }
            }
          } else {
            existing.push({ pos, translations });
          }
        } else {
          result.set(word, [{ pos, translations }]);
        }
      }
    } catch {
      // skip malformed lines
    }
  }

  return result;
}

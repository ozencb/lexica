import fs from "fs";
import path from "path";

const CACHE_DIR = path.join(process.cwd(), "data/pipeline-cache/frequency");
const BASE_URL =
  "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018";

export async function fetchFrequencyWords(
  lang: string,
  count: number
): Promise<Array<{ word: string; rank: number }>> {
  const cacheFile = path.join(CACHE_DIR, `${lang}_50k.txt`);

  if (!fs.existsSync(cacheFile)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    const url = `${BASE_URL}/${lang}/${lang}_50k.txt`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch frequency list: ${res.status}`);
    const text = await res.text();
    fs.writeFileSync(cacheFile, text);
  }

  const text = fs.readFileSync(cacheFile, "utf-8");
  const results: Array<{ word: string; rank: number }> = [];

  for (const line of text.split("\n")) {
    if (results.length >= count) break;
    const trimmed = line.trim();
    if (!trimmed) continue;
    const lastSpace = trimmed.lastIndexOf(" ");
    if (lastSpace === -1) continue;
    const word = trimmed.slice(0, lastSpace);
    results.push({ word, rank: results.length + 1 });
  }

  return results;
}

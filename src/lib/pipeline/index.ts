import { fetchFrequencyWords } from "./frequency-words";
import { fetchWiktionaryData } from "./wiktionary";
import { fetchTatoebaSentences } from "./tatoeba";
import { computeCoverage, filterByPos, type CoverageReport } from "./coverage";

export type { CoverageReport, ProcessedWord } from "./coverage";

export async function runPipeline(params: {
  learningLang: string;
  nativeLang: string;
  pos: "noun" | "verb" | "both";
  count: number;
  onProgress?: (step: string, detail: string) => void;
}): Promise<CoverageReport> {
  const { learningLang, nativeLang, pos, count, onProgress } = params;
  const progress = onProgress ?? (() => {});

  progress("wiktionary", "Fetching Wiktionary data...");
  const wiktionaryData = await fetchWiktionaryData(learningLang, nativeLang);

  progress("frequency", "Fetching frequency word list...");
  const allFrequencyWords = await fetchFrequencyWords(learningLang, 50_000);
  const frequencyWords = pos === "both"
    ? allFrequencyWords.slice(0, count)
    : filterByPos(allFrequencyWords, wiktionaryData, pos, count);

  progress("tatoeba", "Fetching example sentences...");
  const tatoebaSentences = await fetchTatoebaSentences(learningLang, nativeLang);

  progress("coverage", "Computing coverage...");
  const report = computeCoverage(frequencyWords, wiktionaryData, tatoebaSentences, pos);

  progress("done", "Pipeline complete.");
  return report;
}

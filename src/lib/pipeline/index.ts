import { fetchFrequencyWords } from "./frequency-words";
import { fetchWiktionaryData } from "./wiktionary";
import { fetchTatoebaSentences } from "./tatoeba";
import { computeCoverage, type CoverageReport } from "./coverage";

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

  progress("frequency", "Fetching frequency word list...");
  const frequencyWords = await fetchFrequencyWords(learningLang, count);

  progress("wiktionary", "Fetching Wiktionary data...");
  const wiktionaryData = await fetchWiktionaryData(learningLang, nativeLang);

  progress("tatoeba", "Fetching example sentences...");
  const tatoebaSentences = await fetchTatoebaSentences(learningLang, nativeLang);

  progress("coverage", "Computing coverage...");
  const report = computeCoverage(frequencyWords, wiktionaryData, tatoebaSentences, pos);

  progress("done", "Pipeline complete.");
  return report;
}

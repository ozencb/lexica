export interface ProcessedWord {
  learningWord: string;
  nativeWord: string | null;
  learningSentence: string | null;
  nativeSentence: string | null;
  partOfSpeech: string;
  frequencyRank: number;
}

export interface CoverageReport {
  total: number;
  complete: number;
  translationOnly: number;
  noTranslation: number;
  words: ProcessedWord[];
}

function sentenceContainsTranslation(
  nativeSentence: string,
  translation: string
): boolean {
  const parts = translation.split(/[,;]/).map((s) => s.trim().toLowerCase());
  return parts.some((part) => {
    if (part.length <= 2) return false;
    const escaped = part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(nativeSentence);
  });
}

export function computeCoverage(
  frequencyWords: Array<{ word: string; rank: number }>,
  wiktionaryData: Map<string, Array<{ pos: string; translations: string[] }>>,
  tatoebaSentences: Map<
    string,
    Array<{ learningSentence: string; nativeSentence: string }>
  >,
  posFilter: "noun" | "verb" | "both"
): CoverageReport {
  let complete = 0;
  let translationOnly = 0;
  let noTranslation = 0;
  const words: ProcessedWord[] = [];

  for (const { word, rank } of frequencyWords) {
    const senses = wiktionaryData.get(word.toLowerCase());
    const sentences = tatoebaSentences.get(word.toLowerCase());

    let selectedSense: { pos: string; translations: string[] } | undefined;
    if (senses && senses.length > 0) {
      if (posFilter !== "both") {
        if (senses[0].pos === posFilter) {
          selectedSense = senses[0];
        }
      } else {
        selectedSense = senses[0];
      }
    }

    const nativeWord = selectedSense?.translations[0] ?? null;
    const pos = selectedSense?.pos ?? "unknown";
    const translations = selectedSense?.translations ?? [];

    let bestSentence: { learningSentence: string; nativeSentence: string } | null = null;
    if (sentences && sentences.length > 0) {
      if (translations.length > 0) {
        for (const sentence of sentences) {
          if (translations.some((t) => sentenceContainsTranslation(sentence.nativeSentence, t))) {
            bestSentence = sentence;
            break;
          }
        }
      }
      if (!bestSentence && posFilter === "both") {
        bestSentence = sentences[0];
      }
    }

    const learningSentence = bestSentence?.learningSentence ?? null;
    const nativeSentence = bestSentence?.nativeSentence ?? null;

    if (nativeWord && learningSentence) {
      complete++;
    } else if (nativeWord) {
      translationOnly++;
    } else {
      noTranslation++;
    }

    words.push({
      learningWord: word,
      nativeWord,
      learningSentence,
      nativeSentence,
      partOfSpeech: pos,
      frequencyRank: rank,
    });
  }

  return { total: frequencyWords.length, complete, translationOnly, noTranslation, words };
}

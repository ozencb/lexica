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

export function computeCoverage(
  frequencyWords: Array<{ word: string; rank: number }>,
  wiktionaryData: Map<string, { pos: string; translations: string[] }>,
  tatoebaSentences: Map<
    string,
    { learningSentence: string; nativeSentence: string }
  >
): CoverageReport {
  let complete = 0;
  let translationOnly = 0;
  let noTranslation = 0;
  const words: ProcessedWord[] = [];

  for (const { word, rank } of frequencyWords) {
    const wikt = wiktionaryData.get(word.toLowerCase());
    const sentence = tatoebaSentences.get(word.toLowerCase());

    const nativeWord = wikt?.translations[0] ?? null;
    const pos = wikt?.pos ?? "unknown";
    const learningSentence = sentence?.learningSentence ?? null;
    const nativeSentence = sentence?.nativeSentence ?? null;

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

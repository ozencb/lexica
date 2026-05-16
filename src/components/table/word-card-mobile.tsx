"use client";

import { TtsCell } from "./tts-cell";
import { Badge } from "@/components/ui/badge";
import type { Word } from "@/hooks/use-words";

type WordCardMobileProps = {
  word: Word;
  learningLang: string;
  nativeLang: string;
};

export function WordCardMobile({
  word,
  learningLang,
  nativeLang,
}: WordCardMobileProps) {
  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TtsCell
            text={word.learningWord}
            lang={learningLang}
            className="font-medium text-primary"
          />
          <span className="text-muted-foreground/40">→</span>
          <TtsCell
            text={word.nativeWord}
            lang={nativeLang}
            className="font-medium"
          />
        </div>
        <Badge variant="secondary" className="text-xs">
          {word.partOfSpeech} #{word.frequencyRank}
        </Badge>
      </div>
      <div className="space-y-1 text-sm">
        <TtsCell
          text={word.learningSentence}
          lang={learningLang}
          className="text-muted-foreground"
        />
        <TtsCell
          text={word.nativeSentence}
          lang={nativeLang}
          className="text-muted-foreground"
        />
      </div>
    </div>
  );
}

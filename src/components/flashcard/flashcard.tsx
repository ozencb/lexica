"use client";

import { useTts } from "@/hooks/use-tts";
import { Volume2 } from "lucide-react";

type FlashcardProps = {
  learningWord: string;
  nativeWord: string;
  learningSentence: string | null;
  nativeSentence: string | null;
  partOfSpeech: string;
  learningLang: string;
  nativeLang: string;
  flipped: boolean;
  onFlip: () => void;
};

function TtsText({
  text,
  lang,
  className = "",
}: {
  text: string;
  lang: string;
  className?: string;
}) {
  const { play } = useTts();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        play(text, lang);
      }}
      aria-label={`Play pronunciation of "${text}"`}
      className={`inline-flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded ${className}`}
    >
      <span>{text}</span>
      <Volume2 className="h-3 w-3 opacity-30 hover:opacity-100 transition-opacity shrink-0" />
    </button>
  );
}

export function Flashcard({
  learningWord,
  nativeWord,
  learningSentence,
  nativeSentence,
  partOfSpeech,
  learningLang,
  nativeLang,
  flipped,
  onFlip,
}: FlashcardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={flipped ? "Flashcard showing answer. Click to flip back." : "Flashcard showing question. Click to reveal answer."}
      className="w-full max-w-md mx-auto cursor-pointer perspective-[1000px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-xl"
      onClick={onFlip}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onFlip(); } }}
    >
      <div
        className="relative transition-transform duration-500 preserve-3d"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front */}
        <div
          className="border border-border/60 rounded-xl p-8 md:p-10 text-center bg-card"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] mb-5 font-medium">
            {learningLang.toUpperCase()} · {partOfSpeech}
          </div>
          <div className="mb-3">
            <TtsText
              text={learningWord}
              lang={learningLang}
              className="text-xl md:text-2xl font-semibold text-primary justify-center"
            />
          </div>
          {learningSentence && (
            <TtsText
              text={learningSentence}
              lang={learningLang}
              className="text-xs text-muted-foreground justify-center leading-relaxed"
            />
          )}
          <div className="text-[10px] text-muted-foreground/25 mt-6 tracking-wide">
            click to flip
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 border border-border/60 rounded-xl p-8 md:p-10 text-center bg-card"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] mb-5 font-medium">
            {nativeLang.toUpperCase()} · {partOfSpeech}
          </div>
          <div className="mb-3">
            <TtsText
              text={nativeWord}
              lang={nativeLang}
              className="text-xl md:text-2xl font-semibold justify-center"
            />
          </div>
          {nativeSentence && (
            <TtsText
              text={nativeSentence}
              lang={nativeLang}
              className="text-xs text-muted-foreground justify-center leading-relaxed"
            />
          )}
        </div>
      </div>
    </div>
  );
}

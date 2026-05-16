"use client";

import { useState, useEffect, useCallback } from "react";
import { useWordSets } from "@/hooks/use-word-sets";
import { Flashcard } from "@/components/flashcard/flashcard";
import { RatingButtons } from "@/components/flashcard/rating-buttons";
import { SessionProgress } from "@/components/flashcard/session-progress";
import { SessionSummary } from "@/components/flashcard/session-summary";
import { WordSetSelector } from "@/components/word-set-selector";
import { Button } from "@/components/ui/button";
import type { Quality, SM2Input } from "@/lib/sm2";

type DueCard = {
  id: string;
  learningWord: string;
  nativeWord: string;
  learningSentence: string | null;
  nativeSentence: string | null;
  partOfSpeech: string;
  frequencyRank: number;
  wordSetId: string;
  easeFactor: number | null;
  intervalDays: number | null;
  repetitions: number | null;
};

export default function FlashcardsPage() {
  const { data: wordSets } = useWordSets();
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [cards, setCards] = useState<DueCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [again, setAgain] = useState(0);
  const [studying, setStudying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(false);

  const activeSetId = selectedSetId || wordSets?.[0]?.id || null;
  const activeSet = wordSets?.find((s) => s.id === activeSetId);
  const currentCard = cards[currentIndex];
  const done = studying && currentIndex >= cards.length;

  const startSession = useCallback(async () => {
    if (!activeSetId) return;
    setLoading(true);
    const res = await fetch(`/api/study/due?wordSetId=${activeSetId}&limit=20`);
    const data = await res.json();
    setCards(data);
    setCurrentIndex(0);
    setFlipped(false);
    setCorrect(0);
    setAgain(0);
    setStudying(true);
    setLoading(false);
  }, [activeSetId]);

  const handleRate = useCallback(
    async (quality: Quality) => {
      if (!currentCard || rating) return;
      setRating(true);

      await fetch("/api/study/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId: currentCard.id, quality }),
      });

      if (quality >= 3) setCorrect((c) => c + 1);
      if (quality === 1) setAgain((a) => a + 1);

      setFlipped(false);
      setTimeout(() => {
        setCurrentIndex((i) => i + 1);
        setRating(false);
      }, 200);
    },
    [currentCard, rating]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!studying || done) return;

      if (e.code === "Space" && !flipped) {
        e.preventDefault();
        setFlipped(true);
      }

      if (flipped && !rating) {
        const keyMap: Record<string, Quality> = {
          "1": 1, Digit1: 1,
          "2": 2, Digit2: 2,
          "3": 3, Digit3: 3,
          "4": 4, Digit4: 4,
        };
        const quality = keyMap[e.key] || keyMap[e.code];
        if (quality) handleRate(quality);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [studying, done, flipped, rating, handleRate]);

  if (done) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[60vh]">
        <SessionSummary
          reviewed={cards.length}
          correct={correct}
          again={again}
          onRestart={startSession}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Flashcards</h1>
        {wordSets && (
          <WordSetSelector
            wordSets={wordSets}
            activeSetId={activeSetId}
            onSetChange={setSelectedSetId}
          />
        )}
      </div>

      {!studying && (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Button onClick={startSession} disabled={!activeSetId || loading} size="lg">
            {loading ? "Loading..." : "Start Studying"}
          </Button>
        </div>
      )}

      {studying && currentCard && (
        <div className="space-y-6 pt-4">
          <SessionProgress
            reviewed={currentIndex}
            total={cards.length}
            correct={correct}
            again={again}
          />

          <Flashcard
            learningWord={currentCard.learningWord}
            nativeWord={currentCard.nativeWord}
            learningSentence={currentCard.learningSentence}
            nativeSentence={currentCard.nativeSentence}
            partOfSpeech={currentCard.partOfSpeech}
            learningLang={activeSet?.learningLang || ""}
            nativeLang={activeSet?.nativeLang || ""}
            flipped={flipped}
            onFlip={() => setFlipped((f) => !f)}
          />

          {flipped && (
            <RatingButtons
              prev={{
                easeFactor: currentCard.easeFactor ?? 2.5,
                intervalDays: currentCard.intervalDays ?? 0,
                repetitions: currentCard.repetitions ?? 0,
              }}
              onRate={handleRate}
              disabled={rating}
            />
          )}

          {!flipped && (
            <p className="text-center text-sm text-muted-foreground/50">
              Press space or click to reveal answer
            </p>
          )}
        </div>
      )}

      {!studying && !activeSetId && (
        <p className="text-muted-foreground text-center">
          No word sets available. Generate or import one first.
        </p>
      )}
    </div>
  );
}

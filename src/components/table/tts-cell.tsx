"use client";

import { Volume2 } from "lucide-react";
import { useTts } from "@/hooks/use-tts";

type TtsCellProps = {
  text: string | null;
  lang: string;
  className?: string;
};

export function TtsCell({ text, lang, className = "" }: TtsCellProps) {
  const { play } = useTts();

  if (!text) return <span className="text-muted-foreground/50">—</span>;

  return (
    <button
      type="button"
      onClick={() => play(text, lang)}
      aria-label={`Play pronunciation of "${text}"`}
      className={`group/tts text-left inline-flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded ${className}`}
    >
      <span>{text}</span>
      <Volume2 className="h-3.5 w-3.5 opacity-0 group-hover/tts:opacity-60 transition-opacity shrink-0" />
    </button>
  );
}

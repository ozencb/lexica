"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TtsCell } from "./tts-cell";
import { WordCardMobile } from "./word-card-mobile";
import type { Word } from "@/hooks/use-words";

type WordTableProps = {
  words: Word[];
  learningLang: string;
  nativeLang: string;
};

const LANG_FLAGS: Record<string, string> = {
  en: "🇬🇧",
  fr: "🇫🇷",
  es: "🇪🇸",
};

export function WordTable({ words, learningLang, nativeLang }: WordTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: words.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 20,
  });

  const lFlag = LANG_FLAGS[learningLang] || "";
  const nFlag = LANG_FLAGS[nativeLang] || "";

  return (
    <>
      {/* Desktop table */}
      <div
        ref={parentRef}
        className="hidden md:block overflow-auto"
        style={{ height: "calc(100vh - 10rem)" }}
      >
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-[15%]">{lFlag} Word</TableHead>
              <TableHead className="w-[35%]">{lFlag} Sentence</TableHead>
              <TableHead className="w-[15%]">{nFlag} Word</TableHead>
              <TableHead className="w-[35%]">{nFlag} Sentence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <tr>
              <td colSpan={4} style={{ padding: 0, border: "none" }}>
                <div
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    position: "relative",
                  }}
                >
                  {virtualizer.getVirtualItems().map((virtualRow) => {
                    const word = words[virtualRow.index];
                    return (
                      <div
                        key={word.id}
                        className="flex border-b"
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <div className="w-[15%] px-4 flex items-center">
                          <TtsCell
                            text={word.learningWord}
                            lang={learningLang}
                            className="text-primary font-medium"
                          />
                        </div>
                        <div className="w-[35%] px-4 flex items-center">
                          <TtsCell
                            text={word.learningSentence}
                            lang={learningLang}
                            className="text-muted-foreground text-sm"
                          />
                        </div>
                        <div className="w-[15%] px-4 flex items-center">
                          <TtsCell
                            text={word.nativeWord}
                            lang={nativeLang}
                            className="text-primary font-medium"
                          />
                        </div>
                        <div className="w-[35%] px-4 flex items-center">
                          <TtsCell
                            text={word.nativeSentence}
                            lang={nativeLang}
                            className="text-muted-foreground text-sm"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </td>
            </tr>
          </TableBody>
        </Table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-2 max-h-[calc(100vh-12rem)] overflow-auto">
        {words.map((word) => (
          <WordCardMobile
            key={word.id}
            word={word}
            learningLang={learningLang}
            nativeLang={nativeLang}
          />
        ))}
      </div>
    </>
  );
}

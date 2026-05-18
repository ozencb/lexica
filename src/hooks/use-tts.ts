"use client";

import { useCallback, useRef } from "react";

const MAX_CACHE_SIZE = 50;
const blobCache = new Map<string, string>();

function cacheGet(key: string): string | undefined {
  const value = blobCache.get(key);
  if (value) {
    blobCache.delete(key);
    blobCache.set(key, value);
  }
  return value;
}

function cacheSet(key: string, value: string) {
  if (blobCache.size >= MAX_CACHE_SIZE) {
    const firstKey = blobCache.keys().next().value;
    if (firstKey) {
      URL.revokeObjectURL(blobCache.get(firstKey)!);
      blobCache.delete(firstKey);
    }
  }
  blobCache.set(key, value);
}

export function useTts() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(async (text: string, lang: string) => {
    if (!text.trim()) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const cacheKey = `${lang}:${text}`;

    let blobUrl = cacheGet(cacheKey);
    if (!blobUrl) {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang }),
      });

      if (!response.ok) return;

      const blob = await response.blob();
      blobUrl = URL.createObjectURL(blob);
      cacheSet(cacheKey, blobUrl);
    }

    const audio = new Audio(blobUrl);
    const rate = parseFloat(localStorage.getItem("tts-speed") || "1");
    audio.playbackRate = rate;
    audio.preservesPitch = true;
    audio.play();
    audioRef.current = audio;
  }, []);

  return { play };
}

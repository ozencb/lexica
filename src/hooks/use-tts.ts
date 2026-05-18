"use client";

import { useCallback, useRef } from "react";

const MAX_CACHE_SIZE = 50;
const audioCache = new Map<string, AudioBuffer>();

function cacheGet(key: string): AudioBuffer | undefined {
  const value = audioCache.get(key);
  if (value) {
    audioCache.delete(key);
    audioCache.set(key, value);
  }
  return value;
}

function cacheSet(key: string, value: AudioBuffer) {
  if (audioCache.size >= MAX_CACHE_SIZE) {
    const firstKey = audioCache.keys().next().value;
    if (firstKey) audioCache.delete(firstKey);
  }
  audioCache.set(key, value);
}

export function useTts() {
  const ctxRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const getContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }, []);

  const play = useCallback(
    async (text: string, lang: string) => {
      if (!text.trim()) return;

      if (currentSourceRef.current) {
        currentSourceRef.current.stop();
        currentSourceRef.current = null;
      }

      const cacheKey = `${lang}:${text}`;
      const ctx = getContext();

      let buffer = cacheGet(cacheKey);
      if (!buffer) {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, lang }),
        });

        if (!response.ok) return;

        const arrayBuffer = await response.arrayBuffer();
        buffer = await ctx.decodeAudioData(arrayBuffer);
        cacheSet(cacheKey, buffer);
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const rate = parseFloat(localStorage.getItem("tts-speed") || "1");
      source.playbackRate.value = rate;
      source.connect(ctx.destination);
      source.start();
      currentSourceRef.current = source;
    },
    [getContext]
  );

  return { play };
}

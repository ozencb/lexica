"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { fetcher } from "@/lib/fetcher";

interface PredefinedSetInfo {
  filename: string;
  metadata: {
    targetLang: string;
    sourceLang: string;
    wordType: string;
    count: number;
    generatedAt: string;
    version: number;
  };
  displayName: string;
}

export function PredefinedSetLoader() {
  const { data: sets } = useSWR<PredefinedSetInfo[]>(
    "/api/predefined-sets",
    fetcher
  );
  const [loadingFile, setLoadingFile] = useState<string | null>(null);
  const [result, setResult] = useState<{
    wordSetId: string;
    name: string;
    wordCount: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!sets || sets.length === 0) return null;

  async function handleLoad(filename: string) {
    setLoadingFile(filename);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/predefined-sets/load", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Load failed");
      setResult(data);
      mutate("/api/word-sets");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoadingFile(null);
    }
  }

  return (
    <div className="space-y-3">
      {sets.map((set) => (
        <div
          key={set.filename}
          className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium">{set.displayName}</p>
            <p className="text-xs text-muted-foreground">
              {set.metadata.count.toLocaleString()} words
            </p>
          </div>
          <Button
            size="sm"
            className="shrink-0 ml-3"
            onClick={() => handleLoad(set.filename)}
            disabled={loadingFile !== null}
          >
            {loadingFile === set.filename ? "Loading..." : "Load"}
          </Button>
        </div>
      ))}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/8 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/8 p-3 text-sm space-y-1.5">
          <p className="font-medium text-emerald-400">
            Loaded {result.wordCount.toLocaleString()} words into &quot;{result.name}&quot;
          </p>
          <Link href="/table" className="text-primary text-xs hover:underline">
            View in table →
          </Link>
        </div>
      )}
    </div>
  );
}

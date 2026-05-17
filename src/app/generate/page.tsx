"use client";

import { useState } from "react";
import Link from "next/link";
import { GenerateForm } from "@/components/generate/generate-form";
import { CoverageReport } from "@/components/generate/coverage-report";
import { Button } from "@/components/ui/button";

interface PipelineResult {
  total: number;
  complete: number;
  translationOnly: number;
  noTranslation: number;
  wordSetId?: string;
}

interface PipelineParams {
  learningLang: string;
  nativeLang: string;
  pos: "noun" | "verb" | "both";
  count: number;
}

export default function GeneratePage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [params, setParams] = useState<PipelineParams | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(p: PipelineParams) {
    setLoading(true);
    setResult(null);
    setSavedId(null);
    setError(null);
    setParams(p);

    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Pipeline failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!params) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...params, confirm: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSavedId(data.wordSetId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8 pt-14 md:pt-8 space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Generate Word Set</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Build a word set from frequency lists, Wiktionary, and Tatoeba
        </p>
      </div>

      <GenerateForm onSubmit={handleGenerate} loading={loading} />

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/8 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {result && !savedId && (
        <div className="space-y-4">
          <CoverageReport
            total={result.total}
            complete={result.complete}
            translationOnly={result.translationOnly}
            noTranslation={result.noTranslation}
          />
          <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
            {saving ? "Saving..." : "Save Word Set"}
          </Button>
        </div>
      )}

      {savedId && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/8 p-3 text-sm space-y-1.5">
          <p className="font-medium text-emerald-400">Word set saved.</p>
          <Link href="/table" className="text-primary text-xs hover:underline">
            View in table →
          </Link>
        </div>
      )}
    </div>
  );
}

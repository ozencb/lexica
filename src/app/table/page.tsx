"use client";

import { useState } from "react";
import { useWords, WordFilters } from "@/hooks/use-words";
import { useWordSets } from "@/hooks/use-word-sets";
import { WordTable } from "@/components/table/word-table";
import { FilterBar } from "@/components/table/filter-bar";
import { WordSetSelector } from "@/components/word-set-selector";

export default function TablePage() {
  const { data: wordSets } = useWordSets();
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [filters, setFilters] = useState<WordFilters>({});

  const activeSetId = selectedSetId || wordSets?.[0]?.id || null;
  const activeSet = wordSets?.find((s) => s.id === activeSetId);
  const { data, isLoading } = useWords(activeSetId, filters);
  const words = data?.items;

  return (
    <div className="p-4 md:p-6 pt-14 md:pt-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <h1 className="text-lg font-semibold tracking-tight">Table</h1>
        {wordSets && (
          <WordSetSelector
            wordSets={wordSets}
            activeSetId={activeSetId}
            onSetChange={setSelectedSetId}
          />
        )}
      </div>

      <FilterBar filters={filters} onChange={setFilters} />

      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading words...</p>
      )}

      {!isLoading && words && words.length > 0 && activeSet && (
        <WordTable
          words={words}
          learningLang={activeSet.learningLang}
          nativeLang={activeSet.nativeLang}
        />
      )}

      {!isLoading && activeSetId && words && words.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No words found. Try adjusting your filters.
        </p>
      )}

      {!isLoading && !activeSetId && (
        <p className="text-sm text-muted-foreground">
          No word sets yet. Generate one or import from CSV/Anki.
        </p>
      )}
    </div>
  );
}

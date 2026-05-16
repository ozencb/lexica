"use client";

import type { WordSet } from "@/hooks/use-word-sets";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WordSetSelectorProps {
  wordSets: WordSet[];
  activeSetId: string | null;
  onSetChange: (id: string) => void;
}

export function WordSetSelector({
  wordSets,
  activeSetId,
  onSetChange,
}: WordSetSelectorProps) {
  const activeSet = wordSets.find((s) => s.id === activeSetId);

  if (wordSets.length === 0) return null;

  return (
    <Select value={activeSetId || ""} onValueChange={(v) => v && onSetChange(v)}>
      <SelectTrigger className="sm:w-[250px]">
        <SelectValue placeholder="Select word set">
          {activeSet?.name}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {wordSets.map((set) => (
          <SelectItem key={set.id} value={set.id}>
            {set.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WordFilters } from "@/hooks/use-words";

type FilterBarProps = {
  filters: WordFilters;
  onChange: (filters: WordFilters) => void;
};

export function FilterBar({ filters, onChange }: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Input
        placeholder="Search words..."
        value={filters.search || ""}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        className="sm:max-w-xs"
      />
      <Select
        value={filters.pos || "all"}
        onValueChange={(v) => onChange({ ...filters, pos: v ?? undefined })}
      >
        <SelectTrigger className="sm:w-[140px]">
          <SelectValue>
            {{ all: "All", noun: "Nouns", verb: "Verbs" }[filters.pos || "all"]}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="noun">Nouns</SelectItem>
          <SelectItem value="verb">Verbs</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.sort || "frequencyRank"}
        onValueChange={(v) => onChange({ ...filters, sort: v ?? undefined })}
      >
        <SelectTrigger className="sm:w-[160px]">
          <SelectValue>
            {{ frequencyRank: "Frequency", learningWord: "Alphabetical" }[filters.sort || "frequencyRank"]}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="frequencyRank">Frequency</SelectItem>
          <SelectItem value="learningWord">Alphabetical</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

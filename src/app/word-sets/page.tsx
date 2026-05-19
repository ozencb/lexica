"use client";

import { useState, useRef, useEffect } from "react";
import { mutate } from "swr";
import { useWordSets } from "@/hooks/use-word-sets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Download } from "lucide-react";
import { PredefinedSetLoader } from "@/components/predefined-sets/predefined-set-loader";

const LANG_LABELS: Record<string, string> = {
  en: "English",
  fr: "French",
  es: "Spanish",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  nl: "Dutch",
  tr: "Turkish",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
};

function langLabel(code: string) {
  return LANG_LABELS[code] || code.toUpperCase();
}

export default function WordSetsPage() {
  const { data: wordSets } = useWordSets();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renamingId]);

  const handleRename = async (id: string) => {
    if (!renameValue.trim()) return;
    await fetch(`/api/word-sets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameValue.trim() }),
    });
    setRenamingId(null);
    mutate("/api/word-sets");
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This will delete all its words and progress.`)) return;
    await fetch(`/api/word-sets/${id}`, { method: "DELETE" });
    mutate("/api/word-sets");
  };

  return (
    <div className="p-4 md:p-6 pt-14 md:pt-6 space-y-4">
      <h1 className="text-lg font-semibold tracking-tight">Word Sets</h1>

      {(!wordSets || wordSets.length === 0) && (
        <p className="text-sm text-muted-foreground">
          No word sets yet. Generate one or import from CSV/Anki.
        </p>
      )}

      <PredefinedSetLoader />

      {wordSets && wordSets.length > 0 && (
        <div className="space-y-1.5">
          {wordSets.map((set) => (
            <div
              key={set.id}
              className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3 transition-colors hover:bg-muted/50"
            >
              {renamingId === set.id ? (
                <form
                  className="flex items-center gap-2 flex-1 mr-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleRename(set.id);
                  }}
                >
                  <Input
                    ref={inputRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="max-w-xs h-8"
                  />
                  <Button type="submit" size="sm" disabled={!renameValue.trim()}>
                    Save
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setRenamingId(null)}
                  >
                    Cancel
                  </Button>
                </form>
              ) : (
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{set.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {langLabel(set.learningLang)} → {langLabel(set.nativeLang)}
                    {" · "}
                    {set.wordCount} {set.wordCount === 1 ? "word" : "words"}
                  </p>
                </div>
              )}

              {renamingId !== set.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" />
                    }
                  >
                    <MoreVertical className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={4}>
                    <DropdownMenuItem
                      onClick={() => {
                        setRenameValue(set.name);
                        setRenamingId(set.id);
                      }}
                    >
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        window.location.href = `/api/export/${set.id}`;
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => handleDelete(set.id, set.name)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

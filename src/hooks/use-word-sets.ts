import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export type WordSet = {
  id: string;
  name: string;
  learningLang: string;
  nativeLang: string;
  createdAt: string;
  wordCount: number;
};

export function useWordSets() {
  return useSWR<WordSet[]>("/api/word-sets", fetcher);
}

export function useWordSet(id: string | null) {
  return useSWR<WordSet>(id ? `/api/word-sets/${id}` : null, fetcher);
}

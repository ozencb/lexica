import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export type Word = {
  id: string;
  wordSetId: string;
  learningWord: string;
  nativeWord: string;
  learningSentence: string | null;
  nativeSentence: string | null;
  partOfSpeech: string;
  frequencyRank: number;
};

export type WordFilters = {
  search?: string;
  pos?: string;
  freqMin?: number;
  freqMax?: number;
  sort?: string;
  order?: string;
  limit?: number;
  offset?: number;
};

export type WordsResponse = {
  items: Word[];
  total: number;
  limit: number;
  offset: number;
};

export function useWords(wordSetId: string | null, filters: WordFilters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.pos) params.set("pos", filters.pos);
  if (filters.freqMin !== undefined) params.set("freqMin", String(filters.freqMin));
  if (filters.freqMax !== undefined) params.set("freqMax", String(filters.freqMax));
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.order) params.set("order", filters.order);
  if (filters.limit !== undefined) params.set("limit", String(filters.limit));
  if (filters.offset !== undefined) params.set("offset", String(filters.offset));

  const query = params.toString();
  const url = wordSetId
    ? `/api/word-sets/${wordSetId}/words${query ? `?${query}` : ""}`
    : null;

  return useSWR<WordsResponse>(url, fetcher);
}

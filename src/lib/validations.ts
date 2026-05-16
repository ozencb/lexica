import { z } from "zod";

export const wordsQuerySchema = z.object({
  search: z.string().optional().default(""),
  pos: z.string().optional().default(""),
  freqMin: z.coerce.number().int().min(0).optional().default(0),
  freqMax: z.coerce.number().int().min(0).optional().default(999999),
  sort: z.enum(["frequencyRank", "learningWord", "nativeWord"]).optional().default("frequencyRank"),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
  limit: z.coerce.number().int().min(1).max(10000).optional().default(10000),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export const studyDueQuerySchema = z.object({
  wordSetId: z.string().min(1, "wordSetId required"),
  pos: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const studyReviewBodySchema = z.object({
  wordId: z.string().min(1),
  quality: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
});

export const wordSetCreateSchema = z.object({
  name: z.string().min(1).max(200),
  learningLang: z.string().min(2).max(10),
  nativeLang: z.string().min(2).max(10),
});

export const progressHistoryQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional().default(30),
});

export const csvMappingSchema = z.object({
  learningWord: z.number().int().min(0),
  nativeWord: z.number().int().min(0),
  learningSentence: z.number().int().min(0).optional(),
  nativeSentence: z.number().int().min(0).optional(),
  partOfSpeech: z.number().int().min(0).optional(),
});

export const ankiMappingSchema = z.object({
  learningWord: z.string().min(1),
  nativeWord: z.string().min(1),
  learningSentence: z.string().optional(),
  nativeSentence: z.string().optional(),
  partOfSpeech: z.string().optional(),
});

export const pipelineBodySchema = z.object({
  learningLang: z.string().min(2).max(10),
  nativeLang: z.string().min(2).max(10),
  pos: z.enum(["noun", "verb", "both"]),
  count: z.number().int().min(1).max(5000),
  confirm: z.boolean().optional().default(false),
});

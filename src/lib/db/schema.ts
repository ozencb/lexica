import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { ulid } from "ulid";

export const wordSets = sqliteTable("word_sets", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => ulid()),
  name: text("name").notNull(),
  learningLang: text("learning_lang").notNull(),
  nativeLang: text("native_lang").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const words = sqliteTable("words", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => ulid()),
  wordSetId: text("word_set_id")
    .notNull()
    .references(() => wordSets.id, { onDelete: "cascade" }),
  learningWord: text("learning_word").notNull(),
  nativeWord: text("native_word").notNull(),
  learningSentence: text("learning_sentence"),
  nativeSentence: text("native_sentence"),
  partOfSpeech: text("part_of_speech").notNull(),
  frequencyRank: integer("frequency_rank").notNull(),
}, (table) => [
  index("words_word_set_id_idx").on(table.wordSetId),
  index("words_frequency_rank_idx").on(table.frequencyRank),
]);

export const studyProgress = sqliteTable("study_progress", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => ulid()),
  wordId: text("word_id")
    .notNull()
    .references(() => words.id, { onDelete: "cascade" }),
  easeFactor: real("ease_factor").notNull().default(2.5),
  intervalDays: real("interval_days").notNull().default(0),
  repetitions: integer("repetitions").notNull().default(0),
  nextReviewAt: integer("next_review_at", { mode: "timestamp" }),
  lastReviewedAt: integer("last_reviewed_at", { mode: "timestamp" }),
}, (table) => [
  index("study_progress_word_id_idx").on(table.wordId),
  index("study_progress_next_review_at_idx").on(table.nextReviewAt),
]);

import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

type DbInstance = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  __db: DbInstance | undefined;
};

function createDb(): DbInstance {
  const sqlite = new Database(process.env.DATABASE_PATH || "data/lexica.db");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS word_sets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      learning_lang TEXT NOT NULL,
      native_lang TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS words (
      id TEXT PRIMARY KEY,
      word_set_id TEXT NOT NULL REFERENCES word_sets(id) ON DELETE CASCADE,
      learning_word TEXT NOT NULL,
      native_word TEXT NOT NULL,
      learning_sentence TEXT,
      native_sentence TEXT,
      part_of_speech TEXT NOT NULL,
      frequency_rank INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS words_word_set_id_idx ON words(word_set_id);
    CREATE INDEX IF NOT EXISTS words_frequency_rank_idx ON words(frequency_rank);
    CREATE TABLE IF NOT EXISTS study_progress (
      id TEXT PRIMARY KEY,
      word_id TEXT NOT NULL REFERENCES words(id) ON DELETE CASCADE,
      ease_factor REAL NOT NULL DEFAULT 2.5,
      interval_days REAL NOT NULL DEFAULT 0,
      repetitions INTEGER NOT NULL DEFAULT 0,
      next_review_at INTEGER,
      last_reviewed_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS study_progress_word_id_idx ON study_progress(word_id);
    CREATE INDEX IF NOT EXISTS study_progress_next_review_at_idx ON study_progress(next_review_at);
  `);

  return drizzle(sqlite, { schema });
}

function getDb(): DbInstance {
  if (!globalForDb.__db) {
    globalForDb.__db = createDb();
  }
  return globalForDb.__db;
}

export const db = new Proxy({} as DbInstance, {
  get(_, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

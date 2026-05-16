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

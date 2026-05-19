import { listPredefinedSets, formatSetDisplayName } from "@/lib/predefined-sets";
import { db } from "@/lib/db";
import { wordSets } from "@/lib/db/schema";

export async function GET() {
  const sets = listPredefinedSets();
  const existing = await db.select({ name: wordSets.name }).from(wordSets);
  const existingNames = new Set(existing.map((r) => r.name));

  return Response.json(
    sets.map((s) => ({
      ...s,
      loaded: existingNames.has(s.displayName),
    }))
  );
}

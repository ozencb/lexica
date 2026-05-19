import { NextRequest } from "next/server";
import {
  loadPredefinedSet,
  formatSetDisplayName,
} from "@/lib/predefined-sets";
import { db } from "@/lib/db";
import { wordSets, words } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  const { filename } = await request.json();
  if (!filename || typeof filename !== "string") {
    return Response.json({ error: "filename required" }, { status: 400 });
  }

  try {
    const set = loadPredefinedSet(filename);
    const name = formatSetDisplayName(set.metadata);

    const [wordSet] = await db
      .insert(wordSets)
      .values({
        name,
        learningLang: set.metadata.targetLang,
        nativeLang: set.metadata.sourceLang,
      })
      .returning();

    for (let i = 0; i < set.words.length; i += 500) {
      await db.insert(words).values(
        set.words.slice(i, i + 500).map((w) => ({
          wordSetId: wordSet.id,
          learningWord: w.learningWord,
          nativeWord: w.nativeWord,
          learningSentence: w.learningSentence,
          nativeSentence: w.nativeSentence,
          partOfSpeech: w.partOfSpeech,
          frequencyRank: w.frequencyRank,
        }))
      );
    }

    return Response.json(
      { wordSetId: wordSet.id, name, wordCount: set.words.length },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Load failed";
    return Response.json({ error: message }, { status: 500 });
  }
}

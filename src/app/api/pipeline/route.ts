import { NextRequest } from "next/server";
import { runPipeline } from "@/lib/pipeline";
import { db } from "@/lib/db";
import { wordSets, words } from "@/lib/db/schema";
import { pipelineBodySchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = pipelineBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { learningLang, nativeLang, pos, count, confirm } = parsed.data;

  try {
    const report = await runPipeline({ learningLang, nativeLang, pos, count });

    if (confirm) {
      const completeWords = report.words.filter((w) => w.nativeWord);

      const [wordSet] = await db
        .insert(wordSets)
        .values({
          name: `${learningLang.toUpperCase()}-${nativeLang.toUpperCase()} ${pos} top ${count}`,
          learningLang,
          nativeLang,
        })
        .returning();

      if (completeWords.length > 0) {
        await db.insert(words).values(
          completeWords.map((w) => ({
            wordSetId: wordSet.id,
            learningWord: w.learningWord,
            nativeWord: w.nativeWord!,
            learningSentence: w.learningSentence,
            nativeSentence: w.nativeSentence,
            partOfSpeech: w.partOfSpeech,
            frequencyRank: w.frequencyRank,
          }))
        );
      }

      return Response.json({ ...report, wordSetId: wordSet.id });
    }

    return Response.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Pipeline failed";
    return Response.json({ error: message }, { status: 500 });
  }
}

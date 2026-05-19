import { parseArgs, promisify } from "node:util";
import { execFile, execFileSync } from "node:child_process";
import fs from "fs";
import path from "path";

const execFileAsync = promisify(execFile);

import { fetchFrequencyWords } from "../src/lib/pipeline/frequency-words";
import { fetchWiktionaryData } from "../src/lib/pipeline/wiktionary";
import { fetchTatoebaSentences } from "../src/lib/pipeline/tatoeba";
import {
  computeCoverage,
  filterByPos,
  type ProcessedWord,
} from "../src/lib/pipeline/coverage";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WordEntry extends ProcessedWord {
  verified: boolean;
}

interface Progress {
  params: { target: string; source: string; type: string; count: number };
  words: WordEntry[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LANG_LABELS: Record<string, string> = {
  en: "English",
  fr: "French",
  es: "Spanish",
};

const ROOT = path.resolve(import.meta.dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "data/predefined-sets");

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

const { values: args } = parseArgs({
  options: {
    target: { type: "string" },
    source: { type: "string" },
    type: { type: "string" },
    count: { type: "string" },
    "batch-size": { type: "string", default: "50" },
    concurrency: { type: "string", default: "3" },
    model: { type: "string", default: "sonnet" },
    force: { type: "boolean", default: false },
  },
  strict: true,
});

const target = args.target!;
const source = args.source!;
const wordType = args.type as "nouns" | "verbs";
const count = parseInt(args.count!, 10);
const batchSize = parseInt(args["batch-size"]!, 10);
const concurrency = parseInt(args.concurrency!, 10);
const model = args.model!;
const force = args.force!;

if (!target || !source || !wordType || !count) {
  console.error(
    "Usage: npx tsx scripts/generate-predefined-set.ts --target <lang> --source <lang> --type <nouns|verbs> --count <n>"
  );
  process.exit(1);
}

if (wordType !== "nouns" && wordType !== "verbs") {
  console.error("--type must be 'nouns' or 'verbs'");
  process.exit(1);
}

const targetLabel = LANG_LABELS[target] ?? target;
const sourceLabel = LANG_LABELS[source] ?? source;
const posFilter: "noun" | "verb" = wordType === "nouns" ? "noun" : "verb";

const outputFile = path.join(
  OUTPUT_DIR,
  `${target}-${source}-${wordType}-${count}.json`
);
const progressFile = path.join(
  OUTPUT_DIR,
  `.progress-${target}-${source}-${wordType}.json`
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadProgress(): Progress | null {
  if (!fs.existsSync(progressFile)) return null;
  const data: Progress = JSON.parse(fs.readFileSync(progressFile, "utf-8"));
  if (
    data.params.target === target &&
    data.params.source === source &&
    data.params.type === wordType &&
    data.params.count === count
  ) {
    return data;
  }
  return null;
}

function saveProgress(words: WordEntry[]): void {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const data: Progress = {
    params: { target, source, type: wordType, count },
    words,
  };
  fs.writeFileSync(progressFile, JSON.stringify(data, null, 2));
}

async function invokeClaude(prompt: string): Promise<string> {
  const cliArgs = ["-p", prompt, "--output-format", "json", "--model", model];
  const { stdout } = await execFileAsync("claude", cliArgs, {
    encoding: "utf-8",
    timeout: 300_000,
    maxBuffer: 50 * 1024 * 1024,
  });
  const response = JSON.parse(stdout);
  if (response.is_error) throw new Error(`Claude error: ${response.result}`);
  return response.result;
}

type LLMResult = Array<{
  learningWord: string;
  nativeWord: string;
  learningSentence: string;
  nativeSentence: string;
}>;

async function runBatches(
  items: WordEntry[],
  buildPrompt: (batch: WordEntry[]) => string,
  mergeResult: (result: LLMResult) => void,
  label: string,
): Promise<void> {
  const batches: WordEntry[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  if (batches.length === 0) return;

  let nextIdx = 0;
  let completed = 0;
  const total = batches.length;

  async function worker() {
    while (true) {
      const idx = nextIdx++;
      if (idx >= total) break;
      const batch = batches[idx];
      const prompt = buildPrompt(batch);

      let result: LLMResult | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const raw = await invokeClaude(prompt);
          result = parseClaudeJSON(raw);
          break;
        } catch (err) {
          const delay = Math.pow(2, attempt) * 5000;
          console.warn(
            `    [${label}] Batch ${idx + 1}/${total} attempt ${attempt + 1} failed. Retrying in ${delay / 1000}s...`
          );
          await sleep(delay);
        }
      }

      if (result) {
        mergeResult(result);
      } else {
        console.error(`    [${label}] Batch ${idx + 1}/${total} failed after 3 attempts, skipping`);
      }

      completed++;
      console.log(`  [${label}] ${completed}/${total} done`);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, total) }, () => worker())
  );
}

function parseClaudeJSON<T>(text: string): T {
  try {
    return JSON.parse(text.trim());
  } catch {
    // try stripping markdown fences
  }
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return JSON.parse(fenceMatch[1].trim());
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) return JSON.parse(arrayMatch[0]);
  throw new Error("Could not parse JSON from Claude response");
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isComplete(w: WordEntry): boolean {
  return !!w.nativeWord && !!w.learningSentence && !!w.nativeSentence;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {

try {
  execFileSync("claude", ["--version"], { stdio: "pipe" });
} catch {
  console.error("Error: 'claude' CLI not found in PATH");
  process.exit(1);
}

if (fs.existsSync(outputFile) && !force) {
  console.error(`Output already exists: ${outputFile}`);
  console.error("Use --force to overwrite.");
  process.exit(1);
}

let words: WordEntry[];

const existing = loadProgress();
if (existing) {
  console.log(`Resuming from progress file (${existing.words.length} words)`);
  words = existing.words;
} else {
  console.log("Running data pipeline...");

  console.log("  Fetching Wiktionary data...");
  const wiktionaryData = await fetchWiktionaryData(target, source);

  console.log("  Fetching frequency words...");
  const allFrequencyWords = await fetchFrequencyWords(target, 50_000);
  const frequencyWords = filterByPos(allFrequencyWords, wiktionaryData, posFilter, count);

  if (frequencyWords.length < count) {
    console.warn(
      `Warning: only ${frequencyWords.length} ${wordType} found (requested ${count})`
    );
  }

  console.log("  Fetching Tatoeba sentences...");
  const tatoebaSentences = await fetchTatoebaSentences(target, source);

  console.log("  Computing coverage...");
  const report = computeCoverage(
    frequencyWords,
    wiktionaryData,
    tatoebaSentences,
    posFilter
  );

  words = report.words.map((w) => ({ ...w, verified: false }));
  saveProgress(words);
  console.log(`Pipeline done. ${words.length} words saved to progress.`);
}

// ---------------------------------------------------------------------------
// LLM gap-filling phase
// ---------------------------------------------------------------------------

console.log(`\nGap-filling with Claude (concurrency: ${concurrency})...`);

const incomplete = words.filter((w) => !w.nativeWord || !w.learningSentence || !w.nativeSentence);
console.log(`  ${incomplete.length} words need gap-filling`);

await runBatches(
  incomplete,
  (batch) => {
    const batchData = batch.map((w) => ({
      learningWord: w.learningWord,
      nativeWord: w.nativeWord,
      learningSentence: w.learningSentence,
      nativeSentence: w.nativeSentence,
    }));
    return `You are a ${targetLabel}↔${sourceLabel} language expert. Fill in missing translations and example sentences for these ${targetLabel} ${wordType}.

For each word, provide:
- nativeWord: the most common ${sourceLabel} translation
- learningSentence: a natural example sentence in ${targetLabel}
- nativeSentence: the ${sourceLabel} translation of that sentence

Return ONLY a valid JSON array. Each element must have: learningWord, nativeWord, learningSentence, nativeSentence.

Words (keep existing accurate data, fill what's missing):
${JSON.stringify(batchData, null, 2)}`;
  },
  (result) => {
    for (const filled of result) {
      const word = words.find((w) => w.learningWord === filled.learningWord);
      if (word) {
        if (filled.nativeWord) word.nativeWord = filled.nativeWord;
        if (filled.learningSentence) word.learningSentence = filled.learningSentence;
        if (filled.nativeSentence) word.nativeSentence = filled.nativeSentence;
      }
    }
    saveProgress(words);
  },
  "gap-fill",
);

// ---------------------------------------------------------------------------
// LLM verification phase
// ---------------------------------------------------------------------------

console.log(`\nVerifying with Claude (concurrency: ${concurrency})...`);

const unverified = words.filter((w) => !w.verified && isComplete(w));
console.log(`  ${unverified.length} words to verify`);

await runBatches(
  unverified,
  (batch) => {
    const batchData = batch.map((w) => ({
      learningWord: w.learningWord,
      nativeWord: w.nativeWord,
      learningSentence: w.learningSentence,
      nativeSentence: w.nativeSentence,
    }));
    return `You are a ${targetLabel}↔${sourceLabel} language expert. Review these ${targetLabel} ${wordType} for accuracy.

Check each entry for:
1. **POS accuracy**: Is the word PRIMARILY used as a ${posFilter} in everyday ${targetLabel}? Words that are mainly adverbs, particles, prepositions, conjunctions, pronouns, or determiners must be rejected even if they have a rare ${posFilter} sense. Examples: "pas" is an adverb (not), not a noun; "ne" is a particle, not a noun. For rejected words, set nativeWord to "REMOVE".
2. Translation accuracy
3. Grammar and naturalness of example sentences
4. Sentence translation accuracy

Fix any errors. Return unchanged entries as-is.
Return ONLY a valid JSON array with the same structure.

Entries:
${JSON.stringify(batchData, null, 2)}`;
  },
  (result) => {
    for (const verified of result) {
      const word = words.find((w) => w.learningWord === verified.learningWord);
      if (word) {
        if (verified.nativeWord === "REMOVE") {
          word.nativeWord = null;
          word.learningSentence = null;
          word.nativeSentence = null;
          word.verified = true;
          continue;
        }
        if (verified.nativeWord) word.nativeWord = verified.nativeWord;
        if (verified.learningSentence) word.learningSentence = verified.learningSentence;
        if (verified.nativeSentence) word.nativeSentence = verified.nativeSentence;
        word.verified = true;
      }
    }
    saveProgress(words);
  },
  "verify",
);

// ---------------------------------------------------------------------------
// Output phase
// ---------------------------------------------------------------------------

console.log("\nWriting output...");

const completeWords = words.filter(isComplete);
const droppedCount = words.length - completeWords.length;

if (droppedCount > 0) {
  console.warn(
    `Warning: dropping ${droppedCount} incomplete words (${completeWords.length}/${words.length} complete)`
  );
}

const output = {
  metadata: {
    targetLang: target,
    sourceLang: source,
    wordType,
    count: completeWords.length,
    generatedAt: new Date().toISOString(),
    version: 1,
  },
  words: completeWords.map(({ verified, ...rest }) => rest),
};

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));

// Clean up progress file on success
if (fs.existsSync(progressFile)) {
  fs.unlinkSync(progressFile);
}

console.log(`Done! ${completeWords.length} words written to ${outputFile}`);

} // end main

main().catch((err) => {
  console.error("Fatal:", err instanceof Error ? err.message : err);
  process.exit(1);
});

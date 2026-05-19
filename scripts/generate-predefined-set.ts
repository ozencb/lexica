import { parseArgs } from "node:util";
import { execFileSync } from "node:child_process";
import fs from "fs";
import path from "path";

import { fetchFrequencyWords } from "../src/lib/pipeline/frequency-words";
import { fetchWiktionaryData } from "../src/lib/pipeline/wiktionary";
import { fetchTatoebaSentences } from "../src/lib/pipeline/tatoeba";
import {
  computeCoverage,
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

function invokeClaude(prompt: string): string {
  const cliArgs = [
    "-p",
    prompt,
    "--output-format",
    "json",
    "--model",
    model,
  ];
  const output = execFileSync("claude", cliArgs, {
    encoding: "utf-8",
    timeout: 300_000,
    maxBuffer: 50 * 1024 * 1024,
  });
  const response = JSON.parse(output);
  if (response.is_error) throw new Error(`Claude error: ${response.result}`);
  return response.result;
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
// Pre-flight
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Pipeline phase
// ---------------------------------------------------------------------------

let words: WordEntry[];

const existing = loadProgress();
if (existing) {
  console.log(`Resuming from progress file (${existing.words.length} words)`);
  words = existing.words;
} else {
  console.log("Running data pipeline...");

  console.log("  Fetching frequency words...");
  const frequencyWords = await fetchFrequencyWords(target, count * 5);

  console.log("  Fetching Wiktionary data...");
  const wiktionaryData = await fetchWiktionaryData(target, source);

  console.log("  Fetching Tatoeba sentences...");
  const tatoebaSentences = await fetchTatoebaSentences(target, source);

  console.log("  Computing coverage...");
  const report = computeCoverage(
    frequencyWords,
    wiktionaryData,
    tatoebaSentences,
    posFilter
  );

  const filtered = report.words.filter((w) => w.partOfSpeech === posFilter);
  const selected = filtered.slice(0, count);

  if (selected.length < count) {
    console.warn(
      `Warning: only ${selected.length} ${wordType} found (requested ${count})`
    );
  }

  words = selected.map((w) => ({ ...w, verified: false }));
  saveProgress(words);
  console.log(`Pipeline done. ${words.length} words saved to progress.`);
}

// ---------------------------------------------------------------------------
// LLM gap-filling phase
// ---------------------------------------------------------------------------

console.log("\nGap-filling with Claude...");

const incomplete = words.filter((w) => !w.nativeWord || !w.learningSentence || !w.nativeSentence);
console.log(`  ${incomplete.length} words need gap-filling`);

for (let i = 0; i < incomplete.length; i += batchSize) {
  const batch = incomplete.slice(i, i + batchSize);

  // skip if all already complete
  if (batch.every((w) => w.nativeWord && w.learningSentence && w.nativeSentence))
    continue;

  const batchNum = Math.floor(i / batchSize) + 1;
  const totalBatches = Math.ceil(incomplete.length / batchSize);
  console.log(`  Batch ${batchNum}/${totalBatches}...`);

  const batchData = batch.map((w) => ({
    learningWord: w.learningWord,
    nativeWord: w.nativeWord,
    learningSentence: w.learningSentence,
    nativeSentence: w.nativeSentence,
  }));

  const prompt = `You are a ${targetLabel}↔${sourceLabel} language expert. Fill in missing translations and example sentences for these ${targetLabel} ${wordType}.

For each word, provide:
- nativeWord: the most common ${sourceLabel} translation
- learningSentence: a natural example sentence in ${targetLabel}
- nativeSentence: the ${sourceLabel} translation of that sentence

Return ONLY a valid JSON array. Each element must have: learningWord, nativeWord, learningSentence, nativeSentence.

Words (keep existing accurate data, fill what's missing):
${JSON.stringify(batchData, null, 2)}`;

  let result: Array<{
    learningWord: string;
    nativeWord: string;
    learningSentence: string;
    nativeSentence: string;
  }> | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const raw = invokeClaude(prompt);
      result = parseClaudeJSON(raw);
      break;
    } catch (err) {
      const delay = Math.pow(2, attempt) * 5000;
      console.warn(
        `    Attempt ${attempt + 1} failed: ${err instanceof Error ? err.message : err}. Retrying in ${delay / 1000}s...`
      );
      await sleep(delay);
    }
  }

  if (!result) {
    console.error(`    Failed after 3 attempts, skipping batch ${batchNum}`);
    continue;
  }

  // Merge results back into words array
  for (const filled of result) {
    const word = words.find((w) => w.learningWord === filled.learningWord);
    if (word) {
      if (filled.nativeWord) word.nativeWord = filled.nativeWord;
      if (filled.learningSentence)
        word.learningSentence = filled.learningSentence;
      if (filled.nativeSentence) word.nativeSentence = filled.nativeSentence;
    }
  }

  saveProgress(words);
}

// ---------------------------------------------------------------------------
// LLM verification phase
// ---------------------------------------------------------------------------

console.log("\nVerifying with Claude...");

const unverified = words.filter((w) => !w.verified && isComplete(w));
console.log(`  ${unverified.length} words to verify`);

for (let i = 0; i < unverified.length; i += batchSize) {
  const batch = unverified.slice(i, i + batchSize);

  if (batch.every((w) => w.verified)) continue;

  const batchNum = Math.floor(i / batchSize) + 1;
  const totalBatches = Math.ceil(unverified.length / batchSize);
  console.log(`  Batch ${batchNum}/${totalBatches}...`);

  const batchData = batch.map((w) => ({
    learningWord: w.learningWord,
    nativeWord: w.nativeWord,
    learningSentence: w.learningSentence,
    nativeSentence: w.nativeSentence,
  }));

  const prompt = `You are a ${targetLabel}↔${sourceLabel} language expert. Review these vocabulary entries for accuracy.

Check each entry for:
1. Translation accuracy
2. Grammar and naturalness of example sentences
3. Sentence translation accuracy

Fix any errors. Return unchanged entries as-is.
Return ONLY a valid JSON array with the same structure.

Entries:
${JSON.stringify(batchData, null, 2)}`;

  let result: Array<{
    learningWord: string;
    nativeWord: string;
    learningSentence: string;
    nativeSentence: string;
  }> | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const raw = invokeClaude(prompt);
      result = parseClaudeJSON(raw);
      break;
    } catch (err) {
      const delay = Math.pow(2, attempt) * 5000;
      console.warn(
        `    Attempt ${attempt + 1} failed: ${err instanceof Error ? err.message : err}. Retrying in ${delay / 1000}s...`
      );
      await sleep(delay);
    }
  }

  if (!result) {
    console.error(`    Failed after 3 attempts, skipping batch ${batchNum}`);
    continue;
  }

  for (const verified of result) {
    const word = words.find((w) => w.learningWord === verified.learningWord);
    if (word) {
      if (verified.nativeWord) word.nativeWord = verified.nativeWord;
      if (verified.learningSentence)
        word.learningSentence = verified.learningSentence;
      if (verified.nativeSentence)
        word.nativeSentence = verified.nativeSentence;
      word.verified = true;
    }
  }

  saveProgress(words);
}

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

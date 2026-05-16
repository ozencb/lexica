"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
  { value: "tr", label: "Turkish" },
];

const SCHEMA_FIELDS = [
  { key: "learningWord", label: "Learning Word", required: true },
  { key: "nativeWord", label: "Native Word", required: true },
  { key: "learningSentence", label: "Learning Sentence", required: false },
  { key: "nativeSentence", label: "Native Sentence", required: false },
  { key: "partOfSpeech", label: "Part of Speech", required: false },
] as const;

type SchemaField = (typeof SCHEMA_FIELDS)[number]["key"];

interface AnkiModel {
  id: string;
  name: string;
  fields: string[];
}

interface AnkiPreviewNote {
  modelId: string;
  fields: Record<string, string>;
}

export function AnkiImport() {
  const [models, setModels] = useState<AnkiModel[]>([]);
  const [previewNotes, setPreviewNotes] = useState<AnkiPreviewNote[]>([]);
  const [totalNotes, setTotalNotes] = useState(0);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Record<SchemaField, string | null>>({
    learningWord: null,
    nativeWord: null,
    learningSentence: null,
    nativeSentence: null,
    partOfSpeech: null,
  });
  const [wordSetName, setWordSetName] = useState("");
  const [learningLang, setLearningLang] = useState("fr");
  const [nativeLang, setNativeLang] = useState("en");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ id: string; name: string } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [fileRef, setFileRef] = useState<File | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileRef(file);
    setResult(null);
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import/anki/preview", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse file");

      setModels(data.models);
      setPreviewNotes(data.previewNotes);
      setTotalNotes(data.totalNotes);

      if (data.models.length > 0) {
        setSelectedModel(data.models[0].id);
      }

      if (!wordSetName) {
        setWordSetName(file.name.replace(/\.apkg$/i, ""));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
    } finally {
      setLoading(false);
    }
  }

  function updateMapping(field: SchemaField, value: string) {
    setMapping((prev) => ({
      ...prev,
      [field]: value === "__none__" ? null : value,
    }));
  }

  const currentModel = models.find((m) => m.id === selectedModel);
  const ankiFields = currentModel?.fields ?? [];

  const modelNotes = previewNotes.filter(
    (n) => n.modelId === selectedModel
  );

  const mappedFields = SCHEMA_FIELDS.filter(
    (f) => mapping[f.key] != null
  );

  async function handleImport() {
    if (!fileRef) return;
    if (!mapping.learningWord || !mapping.nativeWord) {
      setError("Learning Word and Native Word mappings are required");
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", fileRef);
      formData.append(
        "mapping",
        JSON.stringify({
          learningWord: mapping.learningWord,
          nativeWord: mapping.nativeWord,
          ...(mapping.learningSentence && {
            learningSentence: mapping.learningSentence,
          }),
          ...(mapping.nativeSentence && {
            nativeSentence: mapping.nativeSentence,
          }),
          ...(mapping.partOfSpeech && {
            partOfSpeech: mapping.partOfSpeech,
          }),
        })
      );
      formData.append("wordSetName", wordSetName);
      formData.append("learningLang", learningLang);
      formData.append("nativeLang", nativeLang);

      const res = await fetch("/api/import/anki", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Anki Package (.apkg)</label>
        <Input
          type="file"
          accept=".apkg"
          onChange={handleFileChange}
          disabled={loading}
        />
        {loading && (
          <p className="text-sm text-muted-foreground">Parsing file...</p>
        )}
      </div>

      {models.length > 0 && (
        <>
          {models.length > 1 && (
            <div className="space-y-1">
              <label className="text-sm font-medium">Note Type</label>
              <Select
                value={selectedModel ?? undefined}
                onValueChange={(v) => v && setSelectedModel(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} ({m.fields.length} fields)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Field Mapping</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {totalNotes} notes found. Anki fields:{" "}
                {ankiFields.join(", ")}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SCHEMA_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <label className="text-sm font-medium">
                      {field.label}
                      {field.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </label>
                    <Select
                      value={mapping[field.key] ?? "__none__"}
                      onValueChange={(v) => v && updateMapping(field.key, v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">-- Skip --</SelectItem>
                        {ankiFields.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Word Set Name</label>
              <Input
                value={wordSetName}
                onChange={(e) => setWordSetName(e.target.value)}
                placeholder="My Word Set"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Learning Language</label>
              <Select
                value={learningLang}
                onValueChange={(v) => v && setLearningLang(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{LANGUAGES.find((l) => l.value === learningLang)?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Native Language</label>
              <Select
                value={nativeLang}
                onValueChange={(v) => v && setNativeLang(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{LANGUAGES.find((l) => l.value === nativeLang)?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {mappedFields.length > 0 && modelNotes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Preview (first 5 notes)</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {mappedFields.map((f) => (
                        <TableHead key={f.key}>{f.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modelNotes.map((note, i) => (
                      <TableRow key={i}>
                        {mappedFields.map((f) => (
                          <TableCell key={f.key}>
                            {mapping[f.key]
                              ? note.fields[mapping[f.key]!] ?? ""
                              : ""}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {result ? (
            <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4 text-sm space-y-2">
              <p className="font-medium text-green-500">
                Imported {totalNotes} words into &quot;{result.name}&quot;
              </p>
              <Link href="/table" className="text-primary underline text-sm">
                View in table
              </Link>
            </div>
          ) : (
            <Button
              onClick={handleImport}
              disabled={
                importing ||
                !mapping.learningWord ||
                !mapping.nativeWord ||
                !wordSetName
              }
              className="w-full"
              size="lg"
            >
              {importing ? "Importing..." : "Import"}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

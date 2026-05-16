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
import { parseCSV } from "@/lib/import/csv-parser";

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

export function CSVImport() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<SchemaField, number | null>>({
    learningWord: null,
    nativeWord: null,
    learningSentence: null,
    nativeSentence: null,
    partOfSpeech: null,
  });
  const [wordSetName, setWordSetName] = useState("");
  const [learningLang, setLearningLang] = useState("fr");
  const [nativeLang, setNativeLang] = useState("en");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ id: string; name: string } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [fileRef, setFileRef] = useState<File | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileRef(file);
    setResult(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      setHeaders(parsed.headers);
      setRows(parsed.rows);

      // Auto-set name from filename
      if (!wordSetName) {
        setWordSetName(file.name.replace(/\.(csv|tsv|txt)$/i, ""));
      }
    };
    reader.readAsText(file);
  }

  function updateMapping(field: SchemaField, colIndex: string) {
    setMapping((prev) => ({
      ...prev,
      [field]: colIndex === "__none__" ? null : Number(colIndex),
    }));
  }

  async function handleImport() {
    if (!fileRef) return;
    if (mapping.learningWord == null || mapping.nativeWord == null) {
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
          ...(mapping.learningSentence != null && {
            learningSentence: mapping.learningSentence,
          }),
          ...(mapping.nativeSentence != null && {
            nativeSentence: mapping.nativeSentence,
          }),
          ...(mapping.partOfSpeech != null && {
            partOfSpeech: mapping.partOfSpeech,
          }),
        })
      );
      formData.append("wordSetName", wordSetName);
      formData.append("learningLang", learningLang);
      formData.append("nativeLang", nativeLang);

      const res = await fetch("/api/import/csv", {
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

  const previewRows = rows.slice(0, 5);
  const mappedFields = SCHEMA_FIELDS.filter(
    (f) => mapping[f.key] != null
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">CSV/TSV File</label>
        <Input
          type="file"
          accept=".csv,.tsv,.txt"
          onChange={handleFileChange}
        />
      </div>

      {headers.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Column Mapping</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Detected {headers.length} columns, {rows.length} rows
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
                      value={
                        mapping[field.key] != null
                          ? String(mapping[field.key])
                          : "__none__"
                      }
                      onValueChange={(v) => v && updateMapping(field.key, v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">-- Skip --</SelectItem>
                        {headers.map((h, i) => (
                          <SelectItem key={i} value={String(i)}>
                            {h || `Column ${i + 1}`}
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

          {mappedFields.length > 0 && previewRows.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Preview (first 5 rows)</CardTitle>
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
                    {previewRows.map((row, ri) => (
                      <TableRow key={ri}>
                        {mappedFields.map((f) => (
                          <TableCell key={f.key}>
                            {mapping[f.key] != null
                              ? row[mapping[f.key]!] ?? ""
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
                Imported {rows.length} words into &quot;{result.name}&quot;
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
                mapping.learningWord == null ||
                mapping.nativeWord == null ||
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

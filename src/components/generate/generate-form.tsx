"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
];

interface GenerateFormProps {
  onSubmit: (params: {
    learningLang: string;
    nativeLang: string;
    pos: "noun" | "verb" | "both";
    count: number;
  }) => void;
  loading: boolean;
}

export function GenerateForm({ onSubmit, loading }: GenerateFormProps) {
  const [learningLang, setLearningLang] = useState("fr");
  const [nativeLang, setNativeLang] = useState("en");
  const [pos, setPos] = useState<"noun" | "verb" | "both">("both");
  const [count, setCount] = useState(1000);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Learning Language</label>
          <Select value={learningLang} onValueChange={(v) => v && setLearningLang(v)}>
            <SelectTrigger className="w-full">
              <SelectValue>{LANGUAGES.find((l) => l.value === learningLang)?.label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Native Language</label>
          <Select value={nativeLang} onValueChange={(v) => v && setNativeLang(v)}>
            <SelectTrigger className="w-full">
              <SelectValue>{LANGUAGES.find((l) => l.value === nativeLang)?.label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Part of Speech</label>
        <div className="flex gap-1.5">
          {(["noun", "verb", "both"] as const).map((option) => (
            <Button
              key={option}
              variant={pos === option ? "default" : "outline"}
              size="sm"
              onClick={() => setPos(option)}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Word Count: <span className="text-foreground tabular-nums">{count.toLocaleString()}</span>
        </label>
        <Slider
          value={[count]}
          onValueChange={(val) => setCount(Array.isArray(val) ? val[0] : val)}
          min={500}
          max={5000}
          step={100}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>500</span>
          <span>5,000</span>
        </div>
      </div>

      <Button
        onClick={() => onSubmit({ learningLang, nativeLang, pos, count })}
        disabled={loading}
        className="w-full"
        size="lg"
      >
        {loading ? "Generating..." : "Generate"}
      </Button>
    </div>
  );
}

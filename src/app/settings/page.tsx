"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Download, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [clearing, setClearing] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    const stored = localStorage.getItem("tts-speed");
    if (stored) setSpeed(parseFloat(stored));
  }, []);

  const handleBackup = () => {
    window.location.href = "/api/settings/backup";
  };

  return (
    <div className="p-4 md:p-6 pt-14 md:pt-6 space-y-4 max-w-xl">
      <h1 className="text-lg font-semibold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Database Backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Download a copy of your database including all word sets, words, and
            study progress.
          </p>
          <Button variant="outline" size="sm" onClick={handleBackup}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Download Backup
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">TTS Playback Speed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-6">0.5×</span>
            <Slider
              min={0.5}
              max={2}
              step={0.25}
              value={[speed]}
              onValueChange={(val) => {
                const v = Array.isArray(val) ? val[0] : val;
                setSpeed(v);
                localStorage.setItem("tts-speed", String(v));
              }}
            />
            <span className="text-xs text-muted-foreground w-6">2×</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Current: {speed}×
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">TTS Audio Cache</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Generated TTS audio is cached on disk. Clear the cache to free space.
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={clearing}
            onClick={async () => {
              setClearing(true);
              await fetch("/api/settings/cache", { method: "DELETE" });
              setClearing(false);
            }}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            {clearing ? "Clearing..." : "Clear TTS Cache"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

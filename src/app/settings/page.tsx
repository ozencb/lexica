"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const [clearing, setClearing] = useState(false);

  const handleBackup = () => {
    window.location.href = "/api/settings/backup";
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl">
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Database Backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Download a copy of your database including all word sets, words, and
            study progress.
          </p>
          <Button variant="outline" onClick={handleBackup}>
            <Download className="h-4 w-4 mr-2" />
            Download Backup
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">TTS Audio Cache</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Generated TTS audio is cached on disk. Clear the cache to free space.
          </p>
          <Button
            variant="outline"
            disabled={clearing}
            onClick={async () => {
              setClearing(true);
              await fetch("/api/settings/cache", { method: "DELETE" });
              setClearing(false);
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {clearing ? "Clearing..." : "Clear TTS Cache"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

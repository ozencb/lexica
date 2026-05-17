"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CSVImport } from "@/components/import/csv-import";
import { AnkiImport } from "@/components/import/anki-import";

export default function ImportPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-8 pt-14 md:pt-8 space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Import Word Set</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Import words from a CSV/TSV file or an Anki package
        </p>
      </div>

      <Tabs defaultValue="csv">
        <TabsList>
          <TabsTrigger value="csv">CSV/TSV</TabsTrigger>
          <TabsTrigger value="anki">Anki</TabsTrigger>
        </TabsList>

        <TabsContent value="csv">
          <CSVImport />
        </TabsContent>

        <TabsContent value="anki">
          <AnkiImport />
        </TabsContent>
      </Tabs>
    </div>
  );
}

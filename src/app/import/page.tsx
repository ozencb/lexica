"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CSVImport } from "@/components/import/csv-import";
import { AnkiImport } from "@/components/import/anki-import";
import { PredefinedSetLoader } from "@/components/predefined-sets/predefined-set-loader";

function ImportContent() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "csv";

  return (
    <div className="mx-auto max-w-xl px-4 py-8 pt-14 md:pt-8 space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Import Word Set</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Import words from a CSV/TSV file, Anki package, or predefined set
        </p>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="csv">CSV/TSV</TabsTrigger>
          <TabsTrigger value="anki">Anki</TabsTrigger>
          <TabsTrigger value="predefined">Predefined</TabsTrigger>
        </TabsList>

        <TabsContent value="csv">
          <CSVImport />
        </TabsContent>

        <TabsContent value="anki">
          <AnkiImport />
        </TabsContent>

        <TabsContent value="predefined">
          <PredefinedSetLoader />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ImportPage() {
  return (
    <Suspense>
      <ImportContent />
    </Suspense>
  );
}

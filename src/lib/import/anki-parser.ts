import AdmZip from "adm-zip";
import Database from "better-sqlite3";
import { writeFileSync, unlinkSync, mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

interface AnkiModel {
  id: string;
  name: string;
  fields: string[];
}

interface AnkiNote {
  modelId: string;
  fields: Record<string, string>;
}

export function parseAnkiPackage(buffer: Buffer): {
  models: AnkiModel[];
  notes: AnkiNote[];
} {
  const zip = new AdmZip(buffer);
  const entry = zip.getEntry("collection.anki2");
  if (!entry) {
    throw new Error("Invalid .apkg file: missing collection.anki2");
  }

  const tmpDir = mkdtempSync(join(tmpdir(), "anki-"));
  const dbPath = join(tmpDir, "collection.anki2");
  writeFileSync(dbPath, entry.getData());

  try {
    const sqlite = new Database(dbPath, { readonly: true });

    // Extract models from col table
    const colRow = sqlite.prepare("SELECT models FROM col").get() as
      | { models: string }
      | undefined;
    if (!colRow) {
      throw new Error("Invalid Anki database: no col row");
    }

    const modelsJson = JSON.parse(colRow.models) as Record<
      string,
      { name: string; flds: Array<{ name: string }> }
    >;

    const models: AnkiModel[] = Object.entries(modelsJson).map(
      ([id, model]) => ({
        id,
        name: model.name,
        fields: model.flds.map((f) => f.name),
      })
    );

    // Build model lookup by id
    const modelMap = new Map<string, AnkiModel>();
    for (const m of models) {
      modelMap.set(m.id, m);
    }

    // Extract notes
    const noteRows = sqlite
      .prepare("SELECT mid, flds FROM notes")
      .all() as Array<{ mid: number; flds: string }>;

    const notes: AnkiNote[] = noteRows.map((row) => {
      const modelId = String(row.mid);
      const model = modelMap.get(modelId);
      const fieldValues = row.flds.split("\x1f");
      const fields: Record<string, string> = {};

      if (model) {
        model.fields.forEach((name, i) => {
          fields[name] = fieldValues[i] ?? "";
        });
      }

      return { modelId, fields };
    });

    sqlite.close();
    return { models, notes };
  } finally {
    try {
      unlinkSync(dbPath);
    } catch {
      // cleanup best-effort
    }
  }
}

import { parseAnkiPackage } from "@/lib/import/anki-parser";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: "File too large (max 50 MB)" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { models, notes } = parseAnkiPackage(buffer);

    return Response.json({
      models,
      previewNotes: notes.slice(0, 5),
      totalNotes: notes.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to parse file";
    return Response.json({ error: message }, { status: 400 });
  }
}

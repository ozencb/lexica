import { readFileSync } from "fs";
import path from "path";

export async function GET() {
  const dbPath = path.join(process.cwd(), "data", "lexica.db");

  try {
    const buffer = readFileSync(dbPath);
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/x-sqlite3",
        "Content-Disposition": `attachment; filename="lexica-backup-${new Date().toISOString().split("T")[0]}.db"`,
      },
    });
  } catch {
    return Response.json({ error: "Database not found" }, { status: 404 });
  }
}

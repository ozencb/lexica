import { rmSync, mkdirSync, existsSync } from "fs";
import path from "path";

export async function DELETE() {
  const cacheDir = path.join(process.cwd(), "data", "tts-cache");
  if (existsSync(cacheDir)) {
    rmSync(cacheDir, { recursive: true });
    mkdirSync(cacheDir, { recursive: true });
  }
  return Response.json({ cleared: true });
}

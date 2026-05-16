import { db } from "@/lib/db";
import { wordSets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [set] = await db.select().from(wordSets).where(eq(wordSets.id, id));
  if (!set) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(set);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name } = body;

  if (!name) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  const [updated] = await db
    .update(wordSets)
    .set({ name })
    .where(eq(wordSets.id, id))
    .returning();

  if (!updated) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(wordSets).where(eq(wordSets.id, id));
  return new Response(null, { status: 204 });
}

import { listPredefinedSets } from "@/lib/predefined-sets";

export async function GET() {
  const sets = listPredefinedSets();
  return Response.json(sets);
}

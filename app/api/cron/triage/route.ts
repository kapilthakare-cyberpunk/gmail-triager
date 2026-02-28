import { NextRequest } from "next/server";
import { requireCronSecret } from "@/lib/security";
import { runTriage } from "@/lib/triage.pipeline";

export async function POST(req: NextRequest) {
  const guard = requireCronSecret(req);
  if (guard) return guard;

  const result = await runTriage();
  return Response.json(result);
}

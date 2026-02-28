import { runTriage } from "@/lib/triage.pipeline";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const result = await runTriage();
  return Response.json(result);
}

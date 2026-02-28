import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { relabelMessage } from "@/lib/triage.pipeline";

async function readCategory(req: Request): Promise<string | null> {
  const ct = (req.headers.get("content-type") || "").toLowerCase();

  if (ct.includes("application/json")) {
    const body = await req.json().catch(() => null);
    const category = body?.category;
    return typeof category === "string" ? category : null;
  }

  if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
    const fd = await req.formData().catch(() => null);
    const category = fd?.get("category");
    return typeof category === "string" ? category : null;
  }

  const fd = await req.formData().catch(() => null);
  const category = fd?.get("category");
  return typeof category === "string" ? category : null;
}

export async function POST(req: Request, ctx: { params: { messageId: string } }) {
  const session = await getServerSession(authOptions as any);
  if (!session?.user?.email) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const category = await readCategory(req);
  if (!category) return Response.json({ ok: false, error: "missing category" }, { status: 400 });

  const allowed = new Set(["needs-attention", "fyi", "receipt", "newsletter", "system", "done"]);
  if (!allowed.has(category)) return Response.json({ ok: false, error: "invalid category" }, { status: 400 });

  const result = await relabelMessage({ messageId: ctx.params.messageId, category });
  return Response.json(result);
}

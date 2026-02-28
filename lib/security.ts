import { NextRequest } from "next/server";

export function requireCronSecret(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) throw new Error("CRON_SECRET is not set");

  const qp = req.nextUrl.searchParams.get("secret");
  const hdr = req.headers.get("x-cron-secret");

  if (qp !== expected && hdr !== expected) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  return null;
}

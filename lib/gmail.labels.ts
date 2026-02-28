import { getCachedLabelMap, setCachedLabelMap } from "./config";
import { getGmailClient } from "./gmail";

const REQUIRED = [
  "triage/needs-attention",
  "triage/fyi",
  "triage/receipt",
  "triage/newsletter",
  "triage/system",
  "triage/done",
] as const;

export type TriageLabelName = (typeof REQUIRED)[number];

export async function ensureTriageLabels(
  forceRefresh = false
): Promise<Record<TriageLabelName, string>> {
  if (!forceRefresh) {
    const cached = await getCachedLabelMap();
    if (cached) {
      const ok = REQUIRED.every((n) => typeof cached[n] === "string");
      if (ok) return cached as any;
    }
  }

  const gmail = await getGmailClient();
  const list = await gmail.users.labels.list({ userId: "me" });
  const labels = list.data.labels || [];

  const nameToId: Record<string, string> = {};
  for (const l of labels) {
    if (l.name && l.id) nameToId[l.name] = l.id;
  }

  for (const name of REQUIRED) {
    if (!nameToId[name]) {
      const created = await gmail.users.labels.create({
        userId: "me",
        requestBody: {
          name,
          labelListVisibility: "labelShow",
          messageListVisibility: "show",
        },
      });
      const id = created.data.id;
      if (id) nameToId[name] = id;
    }
  }

  const out = Object.fromEntries(
    REQUIRED.map((n) => [n, nameToId[n]])
  ) as Record<TriageLabelName, string>;

  await setCachedLabelMap(out);
  return out;
}

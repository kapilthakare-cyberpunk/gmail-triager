import { sql } from "./db";
import { ensureTriageLabels } from "./gmail.labels";
import { listMessageIds, fetchMessageMetadata } from "./gmail.fetch";
import { modifyMessageLabels } from "./gmail.modify";
import { ruleClassify } from "./triage.rules";
import { autoSkipClassify } from "./triage.autoskip";
import { llmClassify } from "./triage.llm";

const QUERY = "in:anywhere newer_than:1d -in:spam -in:trash";
const TRIAGE_PREFIX = "triage/";

function triageLabelName(category: string) {
  if (category === "needs-attention") return "triage/needs-attention";
  if (category === "fyi") return "triage/fyi";
  if (category === "receipt") return "triage/receipt";
  if (category === "newsletter") return "triage/newsletter";
  if (category === "system") return "triage/system";
  if (category === "done") return "triage/done";
  return "triage/fyi";
}

export async function runTriage() {
  const labelMap = await ensureTriageLabels(false);
  const ids = await listMessageIds(QUERY, 10);

  let scanned = 0,
    newOnes = 0,
    labeled = 0,
    markedRead = 0,
    errors = 0,
    llmCalls = 0;

  for (const item of ids) {
    scanned++;
    const messageId = item.id;

    const exists = await sql`select 1 from triage_messages where message_id = ${messageId} limit 1`;
    if ((exists as any).rowCount > 0) continue;

    newOnes++;

    try {
      const meta = await fetchMessageMetadata(messageId);

      const ruled = ruleClassify({ from: meta.from, subject: meta.subject, snippet: meta.snippet });
      const skipped = ruled ?? autoSkipClassify({ from: meta.from, subject: meta.subject, snippet: meta.snippet });
      const triaged = skipped ?? (llmCalls++, await llmClassify({ from: meta.from, subject: meta.subject, snippet: meta.snippet }));

      const category = triaged.category;
      const markRead = category !== "needs-attention";

      const labelName = triageLabelName(category) as keyof typeof labelMap;
      const addLabelId = (labelMap as any)[labelName] as string;

      const remove: string[] = [];
      if (markRead) remove.push("UNREAD");

      await modifyMessageLabels({
        messageId,
        addLabelIds: [addLabelId],
        removeLabelIds: remove,
      });

      labeled++;
      if (markRead) markedRead++;

      const internalDate = meta.internalDateMs ? new Date(meta.internalDateMs).toISOString() : null;

      await sql`
        insert into triage_messages
          (message_id, thread_id, internal_date, from_email, subject, snippet, category, priority, mark_read, summary, reason, applied_labels)
        values
          (${meta.messageId}, ${meta.threadId}, ${internalDate}, ${meta.from}, ${meta.subject}, ${meta.snippet},
           ${category}, ${triaged.priority}, ${markRead}, ${triaged.one_line_summary}, ${triaged.reason}, ${[labelName]})
      `;
    } catch {
      errors++;
    }
  }

  return { ok: true, query: QUERY, scanned, new: newOnes, labeled, markedRead, errors, llmCalls };
}

export async function relabelMessage(args: { messageId: string; category: string }) {
  const labelMap = await ensureTriageLabels(false);

  const labelName = triageLabelName(args.category) as keyof typeof labelMap;
  const addLabelId = (labelMap as any)[labelName] as string;

  const toRemoveLabelIds: string[] = [];
  for (const [name, id] of Object.entries(labelMap)) {
    if (name.startsWith(TRIAGE_PREFIX)) toRemoveLabelIds.push(id as any);
  }

  const markRead = args.category !== "needs-attention";
  if (markRead) toRemoveLabelIds.push("UNREAD");

  await modifyMessageLabels({
    messageId: args.messageId,
    addLabelIds: [addLabelId],
    removeLabelIds: toRemoveLabelIds,
  });

  await sql`
    update triage_messages
    set category = ${args.category},
        mark_read = ${markRead},
        applied_labels = ${[labelName]},
        processed_at = now()
    where message_id = ${args.messageId}
  `;

  return { ok: true };
}

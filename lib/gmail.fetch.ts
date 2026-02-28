import { getGmailClient } from "./gmail";

export type GmailMeta = {
  messageId: string;
  threadId: string;
  internalDateMs: number;
  from: string;
  subject: string;
  snippet: string;
  labelIds: string[];
};

function headerValue(headers: any[] | undefined, name: string) {
  const h = (headers || []).find(
    (x) => (x.name || "").toLowerCase() === name.toLowerCase()
  );
  return (h?.value || "").toString();
}

export async function listMessageIds(q: string, maxPages = 10) {
  const gmail = await getGmailClient();
  let pageToken: string | undefined = undefined;
  const ids: { id: string; threadId?: string }[] = [];

  for (let i = 0; i < maxPages; i++) {
    const res = await gmail.users.messages.list({
      userId: "me",
      q,
      pageToken,
      maxResults: 500,
      includeSpamTrash: false,
    });

    ids.push(
      ...(res.data.messages || []).map((m) => ({ id: m.id!, threadId: m.threadId }))
    );

    pageToken = res.data.nextPageToken || undefined;
    if (!pageToken) break;
  }

  return ids;
}

export async function fetchMessageMetadata(messageId: string): Promise<GmailMeta> {
  const gmail = await getGmailClient();
  const res = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "metadata",
    metadataHeaders: ["From", "Subject", "Date"],
  });

  const data: any = res.data;
  const headers = data.payload?.headers || [];
  const from = headerValue(headers, "From");
  const subject = headerValue(headers, "Subject");
  const internalDateMs = Number(data.internalDate || 0);

  return {
    messageId,
    threadId: data.threadId || "",
    internalDateMs,
    from,
    subject,
    snippet: data.snippet || "",
    labelIds: data.labelIds || [],
  };
}

export type Category =
  | "needs-attention"
  | "fyi"
  | "receipt"
  | "newsletter"
  | "system"
  | "done";

export type TriageResult = {
  category: Exclude<Category, "done">;
  priority: "P0" | "P1" | "P2";
  one_line_summary: string;
  reason: string;
};

const RX = {
  receipt: /(receipt|invoice|order confirmation|payment|charged|refund|gst|tax)/i,
  newsletter: /(unsubscribe|newsletter|no-reply|noreply|marketing|campaign)/i,
  attention: /(urgent|asap|action required|error|failed|failure|incident|down|outage)/i,
};

export function ruleClassify(input: {
  from: string;
  subject: string;
  snippet: string;
}): TriageResult | null {
  const text = `${input.from}\n${input.subject}\n${input.snippet}`;

  if (RX.attention.test(text)) {
    return {
      category: "needs-attention",
      priority: "P0",
      one_line_summary: input.subject || "Potential urgent email",
      reason: "Rules: urgent/error/incident keywords",
    };
  }
  if (RX.receipt.test(text)) {
    return {
      category: "receipt",
      priority: "P2",
      one_line_summary: input.subject || "Receipt / invoice",
      reason: "Rules: receipt/payment keywords",
    };
  }
  if (RX.newsletter.test(text)) {
    return {
      category: "newsletter",
      priority: "P2",
      one_line_summary: input.subject || "Newsletter",
      reason: "Rules: newsletter/unsubscribe/no-reply patterns",
    };
  }

  return null;
}

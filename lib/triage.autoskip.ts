export type AutoCategory =
  | "needs-attention"
  | "fyi"
  | "receipt"
  | "newsletter"
  | "system";

const AUTO_SENDER_EMAILS = new Set([
  "notifications@github.com",
  "calendar-notification@google.com",
  "hello@digest.producthunt.com",
  "ai@dopamine.chat",
  "credit_cards@icicibank.com",
  "hello@superchat.de",
  "rblalerts@rbl.bank.in",
  "nimfupdates@campaign1.nipponindia.email",
  "cards@icicibank.com",
  "hello@mail.tataplayfiber.com",
  "alerts@axis.bank.in",
  "no-reply@contabo.com",
  "no-reply@accounts.google.com",
  "no-reply@porter.in",
  "enq_d@camsonline.com",
  "noreply@realvnc.com",
  "support@lensrentals.com",
  "noreply@swiggy.in",
  "noreply@notify.cloudflare.com",
  "marketing@learn.deepgram.com",
  "no-reply@amazonpay.in",
  "no-reply@razorpay.com",
  "reservations@primesandzooms.com",
  "info@make.com",
  "billing@tm1.openai.com",
  "hello@producthunt.com",
  "contact@harpa.ai",
  "hello@mail.wispr.ai",
  "airtelupdate@airtel.com",
  "feedback@kotakbank.in",
]);

const AUTO_DOMAINS = new Set([
  "github.com",
  "icicibank.com",
  "google.com", // restricted below
  "rbl.bank.in",
  "digest.producthunt.com",
  "dopamine.chat",
  "superchat.de",
  "campaign1.nipponindia.email",
  "mail.tataplayfiber.com",
  "axis.bank.in",
  "contabo.com",
  "accounts.google.com",
  "porter.in",
  "camsonline.com",
  "realvnc.com",
  "razorpay.com",
  "amazonpay.in",
  "notify.cloudflare.com",
  "learn.deepgram.com",
  "airtel.com",
  "kotakbank.in",
  "mail.beehiiv.com",
]);

const RX_URGENT =
  /(transaction failure|failed|declined|overdue|security alert|sim change|run failed|action required|new login|payment requested|account was deleted|incident|outage|downtime)/i;

const RX_RECEIPT = /(receipt|invoice|order|delivered|bill|payment|charged|refund)/i;
const RX_NEWS = /(daily news|digest|newsletter|what'?s new|unsubscribe)/i;

function parseEmail(from: string): string | null {
  const m = from.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return m ? m[0].toLowerCase() : null;
}

export function autoSkipClassify(input: {
  from: string;
  subject: string;
  snippet: string;
}):
  | {
      category: AutoCategory;
      priority: "P0" | "P1" | "P2";
      one_line_summary: string;
      reason: string;
    }
  | null {
  const email = parseEmail(input.from);
  const subject = input.subject || "";
  const snippet = input.snippet || "";
  const text = `${input.from}\n${subject}\n${snippet}`;

  if (RX_URGENT.test(text)) {
    return {
      category: "needs-attention",
      priority: "P0",
      one_line_summary: subject || "Potential urgent notification",
      reason: "Auto-skip: urgent/failure/security keywords matched",
    };
  }

  if (!email) return null;
  const [local, domain] = email.split("@");

  const isKnown =
    AUTO_SENDER_EMAILS.has(email) ||
    (AUTO_DOMAINS.has(domain) &&
      (domain !== "google.com" || /noreply|no-reply|calendar-notification/.test(local)));

  if (!isKnown) return null;

  if (domain === "github.com") {
    return {
      category: "fyi",
      priority: "P2",
      one_line_summary: subject || "GitHub notification",
      reason: "Auto-skip: GitHub notifications",
    };
  }

  if (RX_RECEIPT.test(text)) {
    return {
      category: "receipt",
      priority: "P2",
      one_line_summary: subject || "Receipt/transaction",
      reason: "Auto-skip: receipt keywords + known automated sender",
    };
  }

  if (RX_NEWS.test(text)) {
    return {
      category: "newsletter",
      priority: "P2",
      one_line_summary: subject || "Newsletter/digest",
      reason: "Auto-skip: newsletter/digest keywords + known automated sender",
    };
  }

  if (
    domain.endsWith("icicibank.com") ||
    domain.endsWith("axis.bank.in") ||
    domain.endsWith("rbl.bank.in") ||
    domain.endsWith("kotakbank.in")
  ) {
    return {
      category: "fyi",
      priority: "P2",
      one_line_summary: subject || "Bank notification",
      reason: "Auto-skip: bank domain default FYI",
    };
  }

  return {
    category: "system",
    priority: "P2",
    one_line_summary: subject || "System notification",
    reason: "Auto-skip: known automated sender/domain",
  };
}

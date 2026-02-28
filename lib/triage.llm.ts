import { z } from "zod";

const OutSchema = z.object({
  category: z.enum(["needs-attention", "fyi", "receipt", "newsletter", "system"]),
  priority: z.enum(["P0", "P1", "P2"]),
  one_line_summary: z.string().min(1).max(240),
  reason: z.string().min(1).max(300),
});

export type LlmTriage = z.infer<typeof OutSchema>;

async function callGroq(prompt: string): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY not set");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.1-70b-versatile",
      temperature: 0.1,
      messages: [
        { role: "system", content: "Return ONLY valid JSON. No markdown." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Groq error: ${res.status} ${await res.text()}`);
  const data: any = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callMistral(prompt: string): Promise<string> {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) throw new Error("MISTRAL_API_KEY not set");

  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "mistral-large-latest",
      temperature: 0.1,
      messages: [
        { role: "system", content: "Return ONLY valid JSON. No markdown." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Mistral error: ${res.status} ${await res.text()}`);
  const data: any = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function llmClassify(input: {
  from: string;
  subject: string;
  snippet: string;
}): Promise<LlmTriage> {
  const prompt =
    `Classify this email for inbox triage.\n` +
    `Return JSON with fields: category (needs-attention|fyi|receipt|newsletter|system), priority (P0|P1|P2), one_line_summary, reason.\n` +
    `Do not invent details beyond the snippet.\n\n` +
    `FROM: ${input.from}\nSUBJECT: ${input.subject}\nSNIPPET: ${input.snippet}\n`;

  const tryParse = (txt: string) => OutSchema.parse(JSON.parse(txt));

  try {
    const out = await callGroq(prompt);
    return tryParse(out);
  } catch {
    const out = await callMistral(prompt);
    return tryParse(out);
  }
}

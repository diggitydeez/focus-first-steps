export type BillingModel = "hourly" | "fixed" | "retainer";
export type Billable = "billable" | "non-billable" | "ask";

export type WorkRow = {
  id: string;
  name: string;
  billable: Billable;
  suggested: boolean;
};

export type Engagement = {
  clientName: string;
  clientConfirm: boolean;
  billingModel: BillingModel;
  billingConfirm: boolean;
  amount: string;
  currency: "EUR" | "USD" | "GBP";
  includedHours: string;
  period: "month" | "week" | "project";
  hoursConfirm: boolean;
  startDate: string;
  projects: WorkRow[];
  categories: WorkRow[];
};

export const SAMPLE_INPUT =
  "I work with Northstar Studio on a monthly €2,000 retainer covering up to 30 hours. Most of my time is split between their website redesign and analytics dashboard. Client calls, revisions and admin should be tracked separately.";

const uid = () => Math.random().toString(36).slice(2, 9);

const STOP = new Set([
  "the","a","an","my","our","their","his","her","this","that","and","on","in","of","to","up",
  "monthly","weekly","hourly","retainer","fixed","flat","client","clients","project","projects",
]);

function titleCase(s: string) {
  return s
    .trim()
    .split(/\s+/)
    .map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function cleanName(raw: string) {
  const words = raw
    .replace(/[^A-Za-z0-9&'’.\- ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const out: string[] = [];
  for (const w of words) {
    if (out.length === 0 && STOP.has(w.toLowerCase())) continue;
    if (out.length >= 4) break;
    if (STOP.has(w.toLowerCase()) && out.length > 0) break;
    out.push(w);
  }
  return out.join(" ").trim();
}

function inferClient(text: string): { name: string; confirm: boolean } {
  const patterns = [
    /\bclient\s+(?:is\s+|called\s+|named\s+)?([A-Za-z0-9&'’.\- ]{3,40})/i,
    /\bwork(?:ing)?\s+with\s+([A-Za-z0-9&'’.\- ]{3,40})/i,
    /\bwith\s+([A-Z][A-Za-z0-9&'’.\-]*(?:\s+[A-Z][A-Za-z0-9&'’.\-]*){0,3})/,
    /\bfor\s+([A-Z][A-Za-z0-9&'’.\-]*(?:\s+[A-Z][A-Za-z0-9&'’.\-]*){0,3})/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const name = cleanName(m[1]);
      if (name.length >= 3) return { name: titleCase(name), confirm: false };
    }
  }
  return { name: "New client", confirm: true };
}

function inferBilling(text: string): { model: BillingModel; confirm: boolean } {
  const t = text.toLowerCase();
  if (/retainer|monthly\s+fee|per month|\/month/.test(t)) return { model: "retainer", confirm: false };
  if (/fixed|flat fee|project fee|fixed fee|one-?off/.test(t)) return { model: "fixed", confirm: false };
  if (/hourly|per hour|an hour|\/h\b|hourly rate/.test(t)) return { model: "hourly", confirm: false };
  return { model: "hourly", confirm: true };
}

function inferAmount(text: string) {
  const m = text.match(/([€$£])\s?([\d][\d.,]*)/) ?? text.match(/([\d][\d.,]*)\s?(eur|usd|gbp)\b/i);
  if (!m) return { amount: "", currency: "EUR" as const, confirm: true };
  const symbol = m[1];
  const currency =
    symbol === "$" || /usd/i.test(symbol) ? "USD" : symbol === "£" || /gbp/i.test(symbol) ? "GBP" : "EUR";
  const raw = (/[€$£]/.test(symbol) ? m[2] : m[1]).replace(/[.,](?=\d{3}\b)/g, "").replace(",", ".");
  const n = Number(raw);
  return {
    amount: Number.isFinite(n) ? String(Math.round(n)) : "",
    currency: currency as "EUR" | "USD" | "GBP",
    confirm: !Number.isFinite(n),
  };
}

function inferHours(text: string) {
  const m = text.match(/(\d[\d.,]*)\s*(?:hours|hrs|hour|h)\b/i) ?? text.match(/(?:hours|hrs)\D{0,12}(\d[\d.,]*)/i);
  if (!m) return { hours: "", confirm: true };
  const n = Number(m[1].replace(",", "."));
  return { hours: Number.isFinite(n) ? String(n) : "", confirm: !Number.isFinite(n) };
}

function splitCandidates(chunk: string) {
  return chunk
    .split(/\band\b|,|;|\/|\+/i)
    .map((s) =>
      s
        .replace(/\b(their|the|a|an|my|our|its|this|that|work|working|time|mostly|most of)\b/gi, " ")
        .replace(/[^A-Za-z0-9&'’\- ]/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((s) => s.length >= 3 && s.split(" ").length <= 5);
}

function inferProjects(text: string): WorkRow[] {
  const markers = [/\bbetween\s+([^.!?]+)/i, /\bincluding\s+([^.!?]+)/i, /\bcovering\s+([^.!?]+)/i, /\bon\s+([^.!?]+)/i];
  let found: string[] = [];
  for (const m of markers) {
    const match = text.match(m);
    if (match) {
      const c = splitCandidates(match[1]).filter((s) => !/^\d|hours?$|retainer|month|week/i.test(s));
      if (c.length) {
        found = c;
        break;
      }
    }
  }
  if (!found.length) {
    found = splitCandidates(text.split(/[.!?]/).slice(1).join(", ")).filter(
      (s) => !/^\d|hours?$|retainer|month|week|invoice/i.test(s),
    );
  }
  const unique: string[] = [];
  for (const f of found) {
    const label = titleCase(f);
    if (!unique.some((u) => u.toLowerCase() === label.toLowerCase())) unique.push(label);
    if (unique.length === 2) break;
  }
  if (!unique.length) unique.push("Project work");
  return unique.map((name) => ({ id: uid(), name, billable: "billable" as Billable, suggested: true }));
}

export function extractEngagement(text: string): Engagement {
  const client = inferClient(text);
  const billing = inferBilling(text);
  const money = inferAmount(text);
  const hours = inferHours(text);
  const projects = inferProjects(text).slice(0, 3);

  return {
    clientName: client.name,
    clientConfirm: client.confirm,
    billingModel: billing.model,
    billingConfirm: billing.confirm,
    amount: money.amount || (billing.model === "hourly" ? "75" : "2000"),
    currency: money.currency,
    includedHours: hours.hours || "20",
    period: billing.model === "retainer" ? "month" : "project",
    hoursConfirm: hours.confirm,
    startDate: new Date().toISOString().slice(0, 10),
    projects,
    categories: [
      { id: uid(), name: "Client communication & admin", billable: "ask", suggested: true },
    ],
  };
}

export const FALLBACK_TEXT = SAMPLE_INPUT;
export const newRow = (name = ""): WorkRow => ({ id: uid(), name, billable: "billable", suggested: false });

export const CURRENCY_SYMBOL: Record<Engagement["currency"], string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
};

export const BILLING_LABEL: Record<BillingModel, string> = {
  hourly: "Hourly",
  fixed: "Fixed fee",
  retainer: "Monthly retainer",
};

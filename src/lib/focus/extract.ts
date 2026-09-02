export type BillingModel = "hourly" | "fixed" | "retainer";
export type Billable = "billable" | "non-billable" | "ask";

export type WorkRow = {
  id: string;
  name: string;
  billable: Billable;
  suggested: boolean;
  estimate?: string | undefined;
  description?: string | undefined;
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
  /** Share of tracked engagement time aimed to stay outside billable delivery. */
  nonBillableTarget: number;
};

export const SAMPLE_INPUT =
  "I work with Northstar Studio on a monthly €2,000 retainer covering up to 30 hours. Most of my time is split between their website redesign and analytics dashboard. Client calls, revisions and admin should be tracked separately.";

const uid = () => Math.random().toString(36).slice(2, 9);

const STOP = new Set([
  "the","a","an","my","our","their","his","her","this","that","and","on","in","of","to","up",
  "monthly","weekly","hourly","retainer","fixed","flat","client","clients","project","projects",
  "includes","include","including","work","working","mostly","most","time","its","split","between",
]);


function titleCase(s: string) {
  return s
    .trim()
    .split(/\s+/)
    .map((w) => (w.length > 2 ? w[0]!.toUpperCase() + w.slice(1) : w))
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

/** Words that end a client name when scanning forward from a lead-in phrase. */
const CLIENT_STOP = new Set([
  "on","for","with","covering","including","includes","under","at","to","in","a","an","the","this",
  "monthly","weekly","hourly","retainer","fixed","flat","per","and","from","about","around","since",
]);

function clientFrom(tail: string): string {
  const tokens = (tail.split(/[.,;:!?()]/)[0] ?? "").split(/\s+/).filter(Boolean);
  const out: string[] = [];
  for (const raw of tokens) {
    const w = raw.replace(/[^A-Za-z0-9&'’.\-]/g, "");
    if (!w) break;
    if (out.length >= 4) break;
    const lower = w.toLowerCase();
    if (w === "&" || lower === "and") {
      if (out.length === 0) break;
      out.push("&");
      continue;
    }
    if (CLIENT_STOP.has(lower)) break;
    // Only accept capitalised tokens (or short suffixes like "Co.") as part of a name.
    if (!/^[A-Z0-9]/.test(w)) break;
    out.push(w);
  }
  while (out.length && out[out.length - 1] === "&") out.pop();
  return out.join(" ").trim();
}

function inferClient(text: string): { name: string; confirm: boolean } {
  const leads = [
    /\b(?:i\s+)?(?:work|working|works)\s+with\s+/i,
    /\b(?:i\s+)?(?:support|supporting|supports|help|helping)\s+/i,
    /\b(?:my\s+)?client\s+(?:is|was)\s+(?:called\s+|named\s+)?/i,
    /\bclient\s+(?:called|named)\s+/i,
    /\b(?:i['’]?m|i\s+am)?\s*work(?:ing)?\s+for\s+/i,
    /\b(?:retainer|engagement|contract)\s+with\s+/i,
    /\bwith\s+/,
    /\bfor\s+/,
  ];
  for (const lead of leads) {
    const m = text.match(lead);
    if (!m || m.index === undefined) continue;
    const name = clientFrom(text.slice(m.index + m[0].length));
    if (name.length >= 3) return { name, confirm: false };
  }
  // Not confident: leave the field empty so the review step asks for it.
  return { name: "", confirm: true };
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
  const symbol = m[1] ?? "";
  const currency =
    symbol === "$" || /usd/i.test(symbol) ? "USD" : symbol === "£" || /gbp/i.test(symbol) ? "GBP" : "EUR";
  const raw = ((/[€$£]/.test(symbol) ? m[2] : m[1]) ?? "").replace(/[.,](?=\d{3}\b)/g, "").replace(",", ".");
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
  const n = Number((m[1] ?? "").replace(",", "."));
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
      const c = splitCandidates(match[1] ?? "").filter((s) => !/^\d|hours?$|retainer|month|week/i.test(s));
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
    nonBillableTarget: DEFAULT_NON_BILLABLE_TARGET,
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

/* ---------- workspace + simulated activity (single source of truth) ---------- */

export type TrackedEntry = {
  id: string;
  description: string;
  rowId: string;
  hours: number;
  /** Overrides the row's billing status when set. */
  billable?: Billable | undefined;
  /** 0 = Monday … 4 = Friday, used by the calendar view. */
  day?: number | undefined;
  /** Start hour in 24h decimal, e.g. 9.5 = 09:30. */
  start?: number | undefined;
};

export type CalendarEvent = {
  id: string;
  title: string;
  time: string;
  hours: number;
  projectId: string;
  categoryId: string;
  billable: Billable;
  status: "uncategorized" | "ready";
  day: number;
  start: number;
};

export const DEFAULT_NON_BILLABLE_TARGET = 10;
export const DEFAULT_WEEKLY_TARGET = 40;

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;

const PROJECT_WORK = [
  ["Discovery and scoping", 3.5],
  ["Build and iteration", 5.5],
  ["Structure and setup", 4],
  ["Review pass", 2.5],
  ["Implementation", 3],
] as const;

/** Deterministic week-one activity derived from the confirmed engagement. */
export function seedEntries(e: Engagement): TrackedEntry[] {
  const out: TrackedEntry[] = [];
  const projects = e.projects.filter((p) => p.name.trim());
  projects.forEach((p, i) => {
    const a = PROJECT_WORK[(i * 2) % PROJECT_WORK.length]!;
    const b = PROJECT_WORK[(i * 2 + 1) % PROJECT_WORK.length]!;
    out.push({ id: `${p.id}-a`, description: a[0], rowId: p.id, hours: a[1], day: i % 5, start: 9 });
    out.push({
      id: `${p.id}-b`,
      description: b[0],
      rowId: p.id,
      hours: b[1],
      day: (i + 2) % 5,
      start: 13,
    });
  });
  e.categories
    .filter((c) => c.name.trim())
    .forEach((c, i) => {
      out.push({
        id: `${c.id}-a`,
        description: i === 0 ? "Client check-in and revisions" : `${c.name} time`,
        rowId: c.id,
        hours: i === 0 ? 4.2 : 1.5,
        day: (i + 1) % 5,
        start: 15,
      });
    });
  return out;
}


export function seedEvents(e: Engagement): CalendarEvent[] {
  const project = e.projects[0]?.id ?? "";
  const category = e.categories[0]?.id ?? "";
  return [
    {
      id: "ev1",
      title: `${e.clientName} weekly check-in`,
      time: "Thu, 14:00–14:45",
      hours: 0.75,
      projectId: project,
      categoryId: category,
      billable: "ask",
      status: "uncategorized",
      day: 3,
      start: 14,
    },
    {
      id: "ev2",
      title: "Feedback and revisions call",
      time: "Fri, 10:00–11:00",
      hours: 1,
      projectId: project,
      categoryId: category,
      billable: "ask",
      status: "uncategorized",
      day: 4,
      start: 10,
    },

  ];
}

/** Lightweight parse used by the "Suggest from description" action. */
export function suggestProject(text: string): { name: string; billable: Billable; estimate: string } {
  const t = text.trim();
  const hours = t.match(/(\d[\d.,]*)\s*(?:hours|hrs|hour|h)\b/i);
  const nonBillable = /non-?billable|internal|admin|unpaid/i.test(t);
  const ask = /\bask\b|not sure|unclear|decide later/i.test(t);
  const first = t.split(/[.,;\n]/)[0] ?? "";
  const name = titleCase(cleanName(first.replace(/^(a|an|the)\s+/i, ""))) || "New project";
  return {
    name: name.slice(0, 48),
    billable: nonBillable ? "non-billable" : ask ? "ask" : "billable",
    estimate: hours ? String(Number((hours[1] ?? "").replace(",", ".")) || "") : "",
  };
}

export function rowLabel(e: Engagement, id: string) {
  return [...e.projects, ...e.categories].find((r) => r.id === id)?.name ?? "Unassigned";
}

export function periodEnd(e: Engagement): Date {
  const start = new Date(e.startDate || new Date().toISOString().slice(0, 10));
  const d = new Date(start);
  if (e.period === "week") d.setDate(d.getDate() + 7);
  else if (e.period === "month") d.setMonth(d.getMonth() + 1);
  else d.setDate(d.getDate() + 30);
  return d;
}

export const formatDay = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** Neutral, editable engagement used when nothing could be extracted (e.g. screenshot import). */
export function neutralEngagement(): Engagement {
  return {
    clientName: "",
    clientConfirm: true,
    billingModel: "retainer",
    billingConfirm: true,
    amount: "",
    currency: "EUR",
    includedHours: "",
    period: "month",
    hoursConfirm: true,
    startDate: new Date().toISOString().slice(0, 10),
    nonBillableTarget: DEFAULT_NON_BILLABLE_TARGET,
    projects: [{ ...newRow(""), suggested: true }],
    categories: [{ ...newRow("Client communication & admin"), billable: "ask", suggested: true }],
  };
}

/** Effective billing status for a tracked entry (entry override, else its row). */
export function entryBillable(e: Engagement, entry: TrackedEntry): Billable {
  if (entry.billable) return entry.billable;
  return [...e.projects, ...e.categories].find((r) => r.id === entry.rowId)?.billable ?? "billable";
}

export type PlannedBlock = { id: string; label: string; day: number; start: number; hours: number };

/** Deterministic planned blocks derived from the engagement, for the calendar view. */
export function plannedBlocks(e: Engagement): PlannedBlock[] {
  const projects = e.projects.filter((p) => p.name.trim());
  if (!projects.length) return [];
  const perDay = Math.max(1, Math.round((Number(e.includedHours) || 20) / 10));
  return [0, 1, 2, 3, 4].map((day) => {
    const p = projects[day % projects.length]!;
    return { id: `plan-${day}`, label: `Planned · ${p.name}`, day, start: 11, hours: perDay };
  });
}

/** Shared timer state so a running timer survives navigation. */
export type TimerState = {
  description: string;
  projectId: string;
  categoryId: string;
  billable: boolean;
  startedAt: number | null;
};

export const emptyTimer = (projectId: string): TimerState => ({
  description: "",
  projectId,
  categoryId: "",
  billable: true,
  startedAt: null,
});

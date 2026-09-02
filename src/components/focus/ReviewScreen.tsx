import { useState } from "react";
import {
  BILLING_LABEL,
  CURRENCY_SYMBOL,
  newRow,
  type Billable,
  type BillingModel,
  type Engagement,
  type WorkRow,
} from "@/lib/focus/extract";
import { OnboardingFrame } from "./OnboardingFrame";
import { Button, Field, Input, Segmented, Select, Tag, Tooltip } from "./ui";

const BILLABLE_OPTS: { value: Billable; label: string }[] = [
  { value: "billable", label: "Billable" },
  { value: "non-billable", label: "Non-billable" },
  { value: "ask", label: "Ask each time" },
];

export function ReviewScreen({
  engagement,
  onChange,
  onBack,
  onSkip,
  onConfirm,
}: {
  engagement: Engagement;
  onChange: (e: Engagement) => void;
  onBack: () => void;
  onSkip: () => void;
  onConfirm: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Engagement>(key: K, value: Engagement[K]) =>
    onChange({ ...engagement, [key]: value });

  const updateRow = (list: "projects" | "categories", id: string, patch: Partial<WorkRow>) =>
    set(
      list,
      engagement[list].map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );

  const removeRow = (list: "projects" | "categories", id: string) =>
    set(
      list,
      engagement[list].filter((r) => r.id !== id),
    );

  function confirm() {
    if (!engagement.clientName.trim()) return setError("Add a client name to continue.");
    if (engagement.projects.some((p) => !p.name.trim())) return setError("Give every project a name, or remove it.");
    setError(null);
    onConfirm();
  }

  return (
    <OnboardingFrame
      step={3}
      title="Review your engagement"
      description="Nothing is created until you confirm it."
      onBack={onBack}
      onSkip={onSkip}
      width="max-w-[820px]"
    >
      <div className="space-y-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Client name"
            badge={engagement.clientConfirm ? <Tag tone="warning">Confirm</Tag> : <Tag tone="accent">Suggested</Tag>}
          >
            <Input
              value={engagement.clientName}
              onChange={(e) => set("clientName", e.target.value)}
              placeholder="Client name"
            />
          </Field>

          <Field
            label="Billing model"
            badge={engagement.billingConfirm ? <Tag tone="warning">Confirm</Tag> : <Tag tone="accent">Suggested</Tag>}
          >
            <Select
              value={engagement.billingModel}
              onChange={(e) => set("billingModel", e.target.value as BillingModel)}
            >
              {(Object.keys(BILLING_LABEL) as BillingModel[]).map((k) => (
                <option key={k} value={k}>
                  {BILLING_LABEL[k]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={engagement.billingModel === "hourly" ? "Hourly rate" : "Fee"}>
            <div className="flex gap-2">
              <Select
                aria-label="Currency"
                className="w-24"
                value={engagement.currency}
                onChange={(e) => set("currency", e.target.value as Engagement["currency"])}
              >
                <option value="EUR">€ EUR</option>
                <option value="USD">$ USD</option>
                <option value="GBP">£ GBP</option>
              </Select>
              <Input
                inputMode="numeric"
                value={engagement.amount}
                onChange={(e) => set("amount", e.target.value.replace(/[^\d.]/g, ""))}
              />
            </div>
          </Field>

          <Field
            label="Included hours"
            hint={
              <Tooltip text="Included hours are the hours covered by the fee before extra work is discussed. Tracked time is what you actually log." />
            }
            badge={engagement.hoursConfirm ? <Tag tone="warning">Confirm</Tag> : undefined}
          >
            <div className="flex gap-2">
              <Input
                inputMode="numeric"
                className="w-24"
                value={engagement.includedHours}
                onChange={(e) => set("includedHours", e.target.value.replace(/[^\d.]/g, ""))}
              />
              <Select
                aria-label="Period"
                value={engagement.period}
                onChange={(e) => set("period", e.target.value as Engagement["period"])}
              >
                <option value="month">per month</option>
                <option value="week">per week</option>
                <option value="project">per project</option>
              </Select>
            </div>
          </Field>

          <Field label="Start date">
            <Input type="date" value={engagement.startDate} onChange={(e) => set("startDate", e.target.value)} />
          </Field>
        </div>

        <RowSection
          title="Projects"
          note="Maximum of 3. Keep it small for the first week."
          rows={engagement.projects}
          onUpdate={(id, patch) => updateRow("projects", id, patch)}
          onRemove={(id) => removeRow("projects", id)}
          onAdd={
            engagement.projects.length < 3
              ? () => set("projects", [...engagement.projects, newRow("")])
              : undefined
          }
          placeholder="Project name"
        />

        <RowSection
          title="Categories"
          note="Reusable across projects."
          rows={engagement.categories}
          onUpdate={(id, patch) => updateRow("categories", id, patch)}
          onRemove={(id) => removeRow("categories", id)}
          onAdd={
            engagement.categories.length < 3
              ? () => set("categories", [...engagement.categories, newRow("")])
              : undefined
          }
          placeholder="Category name"
        />

        <div className="rounded-[10px] border border-border bg-secondary px-4 py-3">
          <p className="text-[13px] text-foreground">
            Focus will create 1 client, {engagement.projects.length}{" "}
            {engagement.projects.length === 1 ? "project" : "projects"} and {engagement.categories.length} reusable{" "}
            {engagement.categories.length === 1 ? "category" : "categories"}.
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {BILLING_LABEL[engagement.billingModel]} · {CURRENCY_SYMBOL[engagement.currency]}
            {engagement.amount || "—"}
            {engagement.billingModel === "hourly" ? "/h" : ""} · {engagement.includedHours || "—"} included hours per{" "}
            {engagement.period}
          </p>
        </div>

        {error && (
          <p role="alert" className="text-[13px] text-destructive">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between">
          <Button onClick={onBack}>Back</Button>
          <Button variant="primary" size="lg" onClick={confirm}>
            Confirm and create
          </Button>
        </div>
      </div>
    </OnboardingFrame>
  );
}

function RowSection({
  title,
  note,
  rows,
  onUpdate,
  onRemove,
  onAdd,
  placeholder,
}: {
  title: string;
  note: string;
  rows: WorkRow[];
  onUpdate: (id: string, patch: Partial<WorkRow>) => void;
  onRemove: (id: string) => void;
  onAdd?: () => void;
  placeholder: string;
}) {
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between border-b border-border pb-2">
        <h2 className="text-[14px] font-semibold text-foreground">{title}</h2>
        <span className="text-[12px] text-muted-foreground">{note}</span>
      </div>

      {rows.length === 0 ? (
        <p className="py-3 text-[13px] text-muted-foreground">Nothing here yet.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="flex flex-wrap items-center gap-2 rounded-[10px] border border-border px-3 py-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-teal" aria-hidden />
              <input
                aria-label={`${title} name`}
                value={row.name}
                placeholder={placeholder}
                onChange={(e) => onUpdate(row.id, { name: e.target.value })}
                className="min-w-[160px] flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
              />
              {row.suggested && <Tag tone="accent">Suggested</Tag>}
              <Segmented
                ariaLabel={`Billable status for ${row.name || "row"}`}
                value={row.billable}
                onChange={(v) => onUpdate(row.id, { billable: v })}
                options={BILLABLE_OPTS}
              />
              <Button variant="danger" size="sm" onClick={() => onRemove(row.id)} aria-label={`Remove ${row.name}`}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      {onAdd && (
        <Button variant="ghost" size="sm" className="mt-2 -ml-2" onClick={onAdd}>
          + Add {title.toLowerCase().replace(/s$/, "")}
        </Button>
      )}
    </section>
  );
}

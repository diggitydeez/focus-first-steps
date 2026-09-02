import type { Billable, Engagement, TrackedEntry } from "@/lib/focus/extract";
import { entryBillable } from "@/lib/focus/extract";
import { Button, Drawer, Field, Input, Select } from "./ui";

const BILLING_OPTS: { value: Billable; label: string }[] = [
  { value: "billable", label: "Billable" },
  { value: "non-billable", label: "Non-billable" },
  { value: "ask", label: "Ask each time" },
];

/** Shared drawer for reviewing and editing categorized tracked time. */
export function TimeDrawer({
  open,
  onClose,
  engagement,
  entries,
  onChange,
  extra = [],
  focusId,
}: {
  open: boolean;
  onClose: () => void;
  engagement: Engagement;
  entries: TrackedEntry[];
  onChange: (entries: TrackedEntry[]) => void;
  extra?: TrackedEntry[];
  focusId?: string | undefined;
}) {
  const total = [...entries, ...extra].reduce((s, e) => s + e.hours, 0);
  const patch = (id: string, p: Partial<TrackedEntry>) =>
    onChange(entries.map((e) => (e.id === id ? { ...e, ...p } : e)));

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Tracked time this week"
      description={`${entries.length + extra.length} categorized entries · ${total.toFixed(1)}h`}
      width="max-w-[520px]"
      footer={
        <div className="flex justify-end">
          <Button size="sm" variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        {entries.map((e) => (
          <div
            key={e.id}
            className={`rounded-[10px] border px-3 py-3 ${focusId === e.id ? "border-primary" : "border-border"}`}
          >
            <Field label="Description">
              <Input value={e.description} onChange={(ev) => patch(e.id, { description: ev.target.value })} />
            </Field>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Project or category">
                <Select value={e.rowId} onChange={(ev) => patch(e.id, { rowId: ev.target.value })}>
                  <optgroup label="Projects">
                    {engagement.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name || "Untitled project"}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Categories">
                    {engagement.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name || "Untitled category"}
                      </option>
                    ))}
                  </optgroup>
                </Select>
              </Field>
              <Field label="Billing status">
                <Select
                  value={entryBillable(engagement, e)}
                  onChange={(ev) => patch(e.id, { billable: ev.target.value as Billable })}
                >
                  {BILLING_OPTS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <Field label="Duration (hours)" className="w-[140px]">
                <Input
                  inputMode="decimal"
                  value={e.hours}
                  onChange={(ev) => patch(e.id, { hours: Number(ev.target.value.replace(/[^\d.]/g, "")) || 0 })}
                />
              </Field>
              <Button variant="danger" size="sm" onClick={() => onChange(entries.filter((x) => x.id !== e.id))}>
                Remove
              </Button>
            </div>
          </div>
        ))}

        {extra.map((e) => (
          <div key={e.id} className="rounded-[10px] border border-dashed border-border px-3 py-2.5">
            <p className="text-[13.5px] text-foreground">{e.description}</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              From calendar · {e.hours.toFixed(2)}h · {entryBillable(engagement, e) === "billable" ? "Billable" : "Non-billable"}
            </p>
          </div>
        ))}

        {entries.length + extra.length === 0 && (
          <p className="text-[13px] text-muted-foreground">No tracked entries yet.</p>
        )}
      </div>
    </Drawer>
  );
}

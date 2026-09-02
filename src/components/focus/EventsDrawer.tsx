import { useEffect, useState } from "react";
import type { Billable, CalendarEvent, Engagement } from "@/lib/focus/extract";
import { Button, Drawer, Field, Select } from "./ui";

const BILLING_OPTS: { value: Billable; label: string }[] = [
  { value: "billable", label: "Billable" },
  { value: "non-billable", label: "Non-billable" },
  { value: "ask", label: "Ask each time" },
];

/** Drawer showing only uncategorized imported calendar events. */
export function EventsDrawer({
  open,
  onClose,
  engagement,
  events,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  engagement: Engagement;
  events: CalendarEvent[];
  onSave: (updated: CalendarEvent[]) => void;
}) {
  const pending = events.filter((e) => e.status === "uncategorized");
  const [draft, setDraft] = useState<CalendarEvent[]>(pending);

  useEffect(() => {
    if (open) setDraft(events.filter((e) => e.status === "uncategorized"));
  }, [open, events]);

  const patch = (id: string, p: Partial<CalendarEvent>) =>
    setDraft((list) => list.map((e) => (e.id === id ? { ...e, ...p } : e)));

  function save(ids: string[], close = false) {
    onSave(draft.filter((e) => ids.includes(e.id)).map((e) => ({ ...e, status: "ready" as const })));
    if (close) onClose();
  }

  function applyToBoth() {
    const first = draft[0];
    if (!first) return;
    const shared = { projectId: first.projectId, categoryId: first.categoryId, billable: first.billable };
    onSave(draft.map((e) => ({ ...e, ...shared, status: "ready" as const })));
    onClose();
  }


  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Uncategorized calendar events"
      description={`${draft.length} imported ${draft.length === 1 ? "event needs" : "events need"} a project and billing status.`}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button size="sm" onClick={applyToBoth} disabled={draft.length < 2}>
            Apply to both
          </Button>
          <div className="flex gap-2">
            <Button size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={draft.length === 0}
              onClick={() => save(draft.map((e) => e.id))}
            >
              Save all
            </Button>
          </div>
        </div>
      }
    >
      {draft.length === 0 ? (
        <p className="text-[13.5px] text-muted-foreground">
          Everything from your calendar is categorized. Nothing left to review.
        </p>
      ) : (
        <div className="space-y-4">
          {draft.map((ev) => (
            <div key={ev.id} className="rounded-[10px] border border-border px-3.5 py-3">
              <p className="text-[14px] font-medium text-foreground">{ev.title}</p>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                {ev.time} · {ev.hours}h
              </p>
              <div className="mt-3 space-y-3">
                <Field label="Project">
                  <Select value={ev.projectId} onChange={(e) => patch(ev.id, { projectId: e.target.value })}>
                    {engagement.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Category">
                  <Select value={ev.categoryId} onChange={(e) => patch(ev.id, { categoryId: e.target.value })}>
                    <option value="">No category</option>
                    {engagement.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Billing">
                  <Select
                    value={ev.billable}
                    onChange={(e) => patch(ev.id, { billable: e.target.value as Billable })}
                  >
                    {BILLING_OPTS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="mt-3 flex justify-end">
                <Button size="sm" variant="primary" onClick={() => save([ev.id])}>
                  Save
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}

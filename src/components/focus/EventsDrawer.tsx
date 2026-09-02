import { useEffect, useRef, useState } from "react";
import { categorizedStatus, type Billable, type CalendarEvent, type Engagement } from "@/lib/focus/extract";
import { cn } from "@/lib/utils";
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
  focusId,
}: {
  open: boolean;
  onClose: () => void;
  engagement: Engagement;
  events: CalendarEvent[];
  onSave: (updated: CalendarEvent[]) => void;
  /** Event to highlight when the drawer opens from a calendar click. */
  focusId?: string | undefined;
}) {
  const pending = events.filter((e) => e.status === "uncategorized");
  const [draft, setDraft] = useState<CalendarEvent[]>(pending);

  useEffect(() => {
    if (open) setDraft(events.filter((e) => e.status === "uncategorized"));
  }, [open, events]);

  const patch = (id: string, p: Partial<CalendarEvent>) =>
    setDraft((list) => list.map((e) => (e.id === id ? { ...e, ...p } : e)));

  const categorized = (e: CalendarEvent) => ({ ...e, status: categorizedStatus(e) });

  function save(ids: string[]) {
    const saved = draft.filter((e) => ids.includes(e.id)).map(categorized);
    const remaining = draft.filter((e) => !ids.includes(e.id));
    onSave(saved);
    setDraft(remaining);
    if (remaining.length === 0) onClose();
  }

  function saveAll() {
    if (draft.length === 0) return;
    onSave(draft.map(categorized));
    setDraft([]);
    onClose();
  }

  function applyToBoth() {
    const first = draft[0];
    if (!first) return;
    const shared = { projectId: first.projectId, categoryId: first.categoryId, billable: first.billable };
    onSave(draft.map((e) => categorized({ ...e, ...shared })));
    setDraft([]);
    onClose();
  }

  const focusedRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (open && focusId) focusedRef.current?.scrollIntoView({ block: "nearest" });
  }, [open, focusId]);


  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Uncategorized calendar events"
      description={
        draft.length === 0
          ? "0 uncategorized events"
          : `${draft.length} imported ${draft.length === 1 ? "event needs" : "events need"} a project and billing status.`
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button size="sm" onClick={applyToBoth} disabled={draft.length < 2}>
            Apply first selection to both
          </Button>
          <div className="flex gap-2">
            <Button size="sm" onClick={onClose}>
              Close
            </Button>
            <Button size="sm" variant="primary" disabled={draft.length === 0} onClick={saveAll}>
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
            <div
              key={ev.id}
              ref={ev.id === focusId ? focusedRef : undefined}
              className={cn(
                "rounded-[10px] border px-3.5 py-3",
                ev.id === focusId ? "border-primary ring-2 ring-ring/40" : "border-border",
              )}
            >
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

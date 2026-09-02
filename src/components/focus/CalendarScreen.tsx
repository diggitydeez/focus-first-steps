import { useState } from "react";
import {
  DAYS,
  plannedBlocks,
  rowLabel,
  type CalendarEvent,
  type Engagement,
  type TrackedEntry,
} from "@/lib/focus/extract";
import { Button, Drawer, Tag } from "./ui";

const START_HOUR = 8;
const END_HOUR = 19;
const PX_PER_HOUR = 44;

function top(start: number) {
  return (start - START_HOUR) * PX_PER_HOUR;
}

const BILLING_LABEL: Record<CalendarEvent["billable"], string> = {
  billable: "Billable",
  "non-billable": "Non-billable",
  ask: "Ask each time",
};

/** Read-only detail panel for a categorized calendar event (tracked or planned). */
function EventDetailDrawer({
  event,
  engagement,
  onClose,
}: {
  event: CalendarEvent | null;
  engagement: Engagement;
  onClose: () => void;
}) {
  if (!event) return null;
  const project = engagement.projects.find((p) => p.id === event.projectId)?.name ?? "No project";
  const category = event.categoryId
    ? (engagement.categories.find((c) => c.id === event.categoryId)?.name ?? "No category")
    : "No category";
  return (
    <Drawer open={event !== null} onClose={onClose} title={event.title} description={`${event.time} · ${event.hours}h`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-[10px] border border-border px-3.5 py-3">
          <span className="text-[13px] text-muted-foreground">State</span>
          {event.status === "tracked" ? <Tag tone="teal">Tracked</Tag> : <Tag tone="neutral">Planned</Tag>}
        </div>
        <div className="flex items-center justify-between rounded-[10px] border border-border px-3.5 py-3">
          <span className="text-[13px] text-muted-foreground">Project</span>
          <span className="text-[13.5px] font-medium text-foreground">{project}</span>
        </div>
        <div className="flex items-center justify-between rounded-[10px] border border-border px-3.5 py-3">
          <span className="text-[13px] text-muted-foreground">Category</span>
          <span className="text-[13.5px] font-medium text-foreground">{category}</span>
        </div>
        <div className="flex items-center justify-between rounded-[10px] border border-border px-3.5 py-3">
          <span className="text-[13px] text-muted-foreground">Billing</span>
          <span className="text-[13.5px] font-medium text-foreground">{BILLING_LABEL[event.billable]}</span>
        </div>
        <div className="flex justify-end pt-1">
          <Button size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

export function CalendarScreen({
  engagement,
  entries,
  events,
  running,
  onOpenEvent,
  onOpenEntry,
}: {
  engagement: Engagement;
  entries: TrackedEntry[];
  events: CalendarEvent[];
  running: { description: string; rowId: string; day: number; start: number; hours: number } | null;
  onOpenEvent: (id: string) => void;
  onOpenEntry: (id: string) => void;
}) {
  const planned = plannedBlocks(engagement);
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const pending = events.filter((e) => e.status === "uncategorized").length;
  const [detailId, setDetailId] = useState<string | null>(null);
  const detail = events.find((e) => e.id === detailId && e.status !== "uncategorized") ?? null;

  return (
    <div className="mx-auto max-w-[1080px] px-6 py-8 md:px-10">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight text-foreground">Calendar</h1>
          <p className="mt-0.5 text-[13.5px] text-muted-foreground">
            <span className="text-teal">{engagement.clientName || "Your client"}</span> · week one, Monday to Friday
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone="neutral">Planned</Tag>
          <Tag tone="accent">Needs review</Tag>
          <Tag tone="teal">Tracked</Tag>
          {pending > 0 && (
            <Button size="sm" onClick={() => onOpenEvent(events.find((e) => e.status === "uncategorized")!.id)}>
              Review {pending}
            </Button>
          )}
        </div>
      </header>

      <div className="overflow-x-auto rounded-[12px] border border-border">
        <div className="flex min-w-[720px]">
          <div className="w-14 shrink-0 border-r border-border pt-8">
            {hours.map((h) => (
              <div key={h} className="pr-2 text-right text-[11px] text-muted-foreground" style={{ height: PX_PER_HOUR }}>
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {DAYS.map((label, day) => (
            <div key={label} className="min-w-0 flex-1 border-r border-border last:border-r-0">
              <div className="border-b border-border px-2 py-1.5 text-center text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </div>
              <div className="relative" style={{ height: (END_HOUR - START_HOUR) * PX_PER_HOUR }}>
                {hours.map((h) => (
                  <div key={h} className="border-b border-border/60" style={{ height: PX_PER_HOUR }} />
                ))}

                {planned
                  .filter((b) => b.day === day)
                  .map((b) => (
                    <div
                      key={b.id}
                      className="absolute inset-x-1 rounded-[6px] border border-dashed border-border bg-secondary/70 px-1.5 py-0.5 text-[11px] text-muted-foreground"
                      style={{ top: top(b.start), height: b.hours * PX_PER_HOUR - 4 }}
                    >
                      {b.label}
                    </div>
                  ))}

                {entries
                  .filter((e) => (e.day ?? 0) === day)
                  .map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => onOpenEntry(e.id)}
                      className="absolute inset-x-1 overflow-hidden rounded-[6px] border border-teal/40 bg-teal-soft px-1.5 py-0.5 text-left text-[11px] text-teal hover:border-teal"
                      style={{ top: top(e.start ?? 9), height: Math.max(22, e.hours * PX_PER_HOUR - 4) }}
                    >
                      <span className="block truncate font-medium">{e.description}</span>
                      <span className="block truncate">{rowLabel(engagement, e.rowId)}</span>
                    </button>
                  ))}

                {events
                  .filter((e) => e.day === day)
                  .map((e) =>
                    e.status === "uncategorized" ? (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => onOpenEvent(e.id)}
                        className="absolute inset-x-1 overflow-hidden rounded-[6px] border border-dashed border-primary/50 bg-accent-soft px-1.5 py-0.5 text-left text-[11px] text-accent-foreground hover:border-primary"
                        style={{ top: top(e.start), height: Math.max(22, e.hours * PX_PER_HOUR - 4) }}
                      >
                        <span className="block truncate font-medium">{e.title}</span>
                        <span className="block truncate">Needs review</span>
                      </button>
                    ) : e.status === "tracked" ? (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setDetailId(e.id)}
                        className="absolute inset-x-1 overflow-hidden rounded-[6px] border border-teal/40 bg-teal-soft px-1.5 py-0.5 text-left text-[11px] text-teal hover:border-teal"
                        style={{ top: top(e.start), height: Math.max(22, e.hours * PX_PER_HOUR - 4) }}
                      >
                        <span className="block truncate font-medium">{e.title}</span>
                        <span className="block truncate">
                          Tracked · {engagement.projects.find((p) => p.id === e.projectId)?.name ?? "No project"}
                        </span>
                      </button>
                    ) : (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setDetailId(e.id)}
                        className="absolute inset-x-1 overflow-hidden rounded-[6px] border border-dashed border-border bg-secondary/70 px-1.5 py-0.5 text-left text-[11px] text-muted-foreground hover:border-muted-foreground/50"
                        style={{ top: top(e.start), height: Math.max(22, e.hours * PX_PER_HOUR - 4) }}
                      >
                        <span className="block truncate font-medium">{e.title}</span>
                        <span className="block truncate">
                          Planned · {engagement.projects.find((p) => p.id === e.projectId)?.name ?? "No project"}
                        </span>
                      </button>
                    ),
                  )}

                {running && running.day === day && (
                  <div
                    className="absolute inset-x-1 overflow-hidden rounded-[6px] border border-primary bg-accent-soft px-1.5 py-0.5 text-[11px] text-accent-foreground"
                    style={{ top: top(running.start), height: Math.max(22, running.hours * PX_PER_HOUR - 4) }}
                  >
                    <span className="block truncate font-medium">
                      {running.description || "Untitled work"} · running
                    </span>
                    <span className="block truncate">{rowLabel(engagement, running.rowId)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 text-[12.5px] text-muted-foreground">
        Simulated week-one view. Click a needs-review event to categorize it, or a tracked or planned event to see its
        details.
      </p>

      <EventDetailDrawer event={detail} engagement={engagement} onClose={() => setDetailId(null)} />
    </div>
  );
}

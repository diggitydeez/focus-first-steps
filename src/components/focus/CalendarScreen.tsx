import {
  DAYS,
  plannedBlocks,
  rowLabel,
  type CalendarEvent,
  type Engagement,
  type TrackedEntry,
} from "@/lib/focus/extract";
import { Button, Tag } from "./ui";

const START_HOUR = 8;
const END_HOUR = 19;
const PX_PER_HOUR = 44;

function top(start: number) {
  return (start - START_HOUR) * PX_PER_HOUR;
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
  onOpenEvent: () => void;
  onOpenEntry: (id: string) => void;
}) {
  const planned = plannedBlocks(engagement);
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const pending = events.filter((e) => e.status === "uncategorized").length;

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
          <Tag tone="warning">Imported event</Tag>
          <Tag tone="teal">Tracked</Tag>
          {pending > 0 && (
            <Button size="sm" onClick={onOpenEvent}>
              Categorize {pending}
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
                  .map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={onOpenEvent}
                      className={`absolute inset-x-1 overflow-hidden rounded-[6px] px-1.5 py-0.5 text-left text-[11px] ${
                        e.status === "uncategorized"
                          ? "border border-warning/50 bg-warning-soft text-warning hover:border-warning"
                          : "border border-teal/40 bg-teal-soft text-teal"
                      }`}
                      style={{ top: top(e.start), height: Math.max(22, e.hours * PX_PER_HOUR - 4) }}
                    >
                      <span className="block truncate font-medium">{e.title}</span>
                      <span className="block truncate">
                        {e.status === "uncategorized" ? "Needs categorizing" : "Ready to track"}
                      </span>
                    </button>
                  ))}

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
        Simulated week-one view. Click an imported event to categorize it, or a tracked entry to edit its details.
      </p>
    </div>
  );
}

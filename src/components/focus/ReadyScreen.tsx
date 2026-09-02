import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { CalendarEvent, Engagement, TimerState } from "@/lib/focus/extract";
import { EventsDrawer } from "./EventsDrawer";
import { Button, Field, Select, Tag, Toggle } from "./ui";

export function ReadyScreen({
  engagement,
  created,
  events,
  timer,
  onTimerChange,
  onStart,
  onStop,
  onSaveEvents,
  onPreviewFriday,
  onBack,
}: {
  engagement: Engagement;
  created: boolean;
  events: CalendarEvent[];
  timer: TimerState;
  onTimerChange: (t: TimerState) => void;
  onStart: () => void;
  onStop: () => void;
  onSaveEvents: (updated: CalendarEvent[]) => void;
  onPreviewFriday: () => void;
  onBack: () => void;
}) {
  const [drawer, setDrawer] = useState(false);
  const [, tick] = useState(0);
  const running = timer.startedAt !== null;
  const pendingCount = events.filter((e) => e.status === "uncategorized").length;

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const elapsed = running ? Math.max(0, Math.floor((Date.now() - (timer.startedAt ?? 0)) / 1000)) : 0;
  const hhmmss = new Date(elapsed * 1000).toISOString().slice(11, 19);

  return (
    <div className="mx-auto max-w-[900px] px-6 py-8 md:px-10">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={onBack}>
          ← Back
        </Button>
        <Button variant="secondary" size="sm" onClick={onPreviewFriday}>
          Preview Friday
        </Button>
      </div>

      {created && (
        <div className="mb-7 flex items-start gap-3 rounded-[12px] border border-border bg-teal-soft/60 px-4 py-3.5">
          <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-teal text-[11px] text-background">
            ✓
          </span>
          <div>
            <h1 className="text-[18px] font-semibold text-foreground">
              {engagement.clientName || "Your client"} is ready
            </h1>
            <p className="mt-0.5 text-[13.5px] text-muted-foreground">
              Your first entry will already be connected to the structure you just reviewed.
            </p>
          </div>
        </div>
      )}

      <section className="rounded-[12px] border border-border">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Timer</h2>
          <span className="inline-flex items-center gap-1.5 text-[13px] text-teal">
            <span className="h-2 w-2 rounded-full bg-teal" aria-hidden />
            {engagement.clientName || "Your client"}
          </span>
        </div>

        <div className="flex flex-wrap items-end gap-3 px-4 py-4">
          <div className="min-w-[220px] flex-1">
            <label htmlFor="timer-desc" className="mb-1.5 block text-[13px] font-medium text-foreground">
              Description
            </label>
            <input
              id="timer-desc"
              value={timer.description}
              onChange={(e) => onTimerChange({ ...timer, description: e.target.value })}
              placeholder="What are you working on?"
              className="h-9 w-full rounded-[8px] border border-border px-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <Field label="Project" className="w-[190px]">
            <Select
              value={timer.projectId}
              onChange={(e) => onTimerChange({ ...timer, projectId: e.target.value })}
            >
              {engagement.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || "Untitled project"}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Category" className="w-[200px]">
            <Select
              value={timer.categoryId}
              onChange={(e) => onTimerChange({ ...timer, categoryId: e.target.value })}
            >
              <option value="">No category</option>
              {engagement.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || "Untitled category"}
                </option>
              ))}
            </Select>
          </Field>

          <div className="flex h-9 items-center gap-2">
            <Toggle
              checked={timer.billable}
              onChange={(v) => onTimerChange({ ...timer, billable: v })}
              label="Billable"
            />
            <span className="text-[13px] text-foreground">Billable</span>
          </div>

          <div className="flex items-center gap-3">
            {running && (
              <span className="font-mono text-[18px] tabular-nums text-foreground" aria-live="polite">
                {hhmmss}
              </span>
            )}
            <Button
              variant="primary"
              size="lg"
              onClick={running ? onStop : onStart}
              className={cn(running && "bg-destructive hover:bg-destructive")}
            >
              {running ? "Stop timer" : "Start timer"}
            </Button>
          </div>
        </div>

        {running && (
          <p className="border-t border-border px-4 py-2 text-[12.5px] text-muted-foreground">
            Tracking {timer.description || "untitled work"} ·{" "}
            {engagement.projects.find((p) => p.id === timer.projectId)?.name || "No project"} ·{" "}
            {timer.billable ? "Billable" : "Non-billable"}
          </p>
        )}
      </section>

      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
            Uncategorized from calendar
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-muted-foreground">
              {pendingCount} uncategorized {pendingCount === 1 ? "event" : "events"}
            </span>
            <Button size="sm" disabled={pendingCount === 0} onClick={() => setDrawer(true)}>
              Review
            </Button>
          </div>
        </div>
        <div className="divide-y divide-border rounded-[12px] border border-border">
          {events.map((ev) => (
            <div key={ev.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] text-foreground">{ev.title}</p>
                <p className="text-[12.5px] text-muted-foreground">
                  {ev.time} · {ev.hours}h
                </p>
              </div>
              {ev.status === "ready" ? (
                <Tag tone="teal">Ready to track</Tag>
              ) : (
                <Button size="sm" onClick={() => setDrawer(true)}>
                  Categorize
                </Button>
              )}
            </div>
          ))}
        </div>
      </section>

      <EventsDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        engagement={engagement}
        events={events}
        onSave={onSaveEvents}
      />
    </div>
  );
}

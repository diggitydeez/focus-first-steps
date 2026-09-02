import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { CalendarEvent, Engagement } from "@/lib/focus/extract";
import { EventsDrawer } from "./EventsDrawer";
import { Button, Field, Select, Tag, Toggle } from "./ui";

export function ReadyScreen({
  engagement,
  created,
  events,
  onSaveEvents,
  onPreviewFriday,
  onBack,
}: {
  engagement: Engagement;
  created: boolean;
  events: CalendarEvent[];
  onSaveEvents: (updated: CalendarEvent[]) => void;
  onPreviewFriday: () => void;
  onBack: () => void;
}) {
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(engagement.projects[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [billable, setBillable] = useState(true);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

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
            <h1 className="text-[18px] font-semibold text-foreground">{engagement.clientName} is ready</h1>
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
            {engagement.clientName}
          </span>
        </div>

        <div className="flex flex-wrap items-end gap-3 px-4 py-4">
          <div className="min-w-[220px] flex-1">
            <label htmlFor="timer-desc" className="mb-1.5 block text-[13px] font-medium text-foreground">
              Description
            </label>
            <input
              id="timer-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you working on?"
              className="h-9 w-full rounded-[8px] border border-border px-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <Field label="Project" className="w-[190px]">
            <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              {engagement.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Category" className="w-[200px]">
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">No category</option>
              {engagement.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>

          <div className="flex h-9 items-center gap-2">
            <Toggle checked={billable} onChange={setBillable} label="Billable" />
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
              onClick={() => setRunning((r) => !r)}
              className={cn(running && "bg-destructive hover:bg-destructive")}
            >
              {running ? "Stop timer" : "Start timer"}
            </Button>
          </div>
        </div>

        {running && (
          <p className="border-t border-border px-4 py-2 text-[12.5px] text-muted-foreground">
            Tracking {description || "untitled work"} ·{" "}
            {engagement.projects.find((p) => p.id === projectId)?.name ?? "No project"} ·{" "}
            {billable ? "Billable" : "Non-billable"}
          </p>
        )}
      </section>

      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
            Uncategorized from calendar
          </h2>
          <Button size="sm" onClick={() => setDrawer(true)}>
            Review
          </Button>
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


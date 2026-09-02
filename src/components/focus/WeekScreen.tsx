import { useMemo, useState } from "react";
import {
  CURRENCY_SYMBOL,
  entryBillable,
  type CalendarEvent,
  type Engagement,
  type TrackedEntry,
} from "@/lib/focus/extract";
import { BurnForecast } from "./BurnForecast";
import { EventsDrawer } from "./EventsDrawer";
import { TimeDrawer } from "./TimeDrawer";
import { Button, Field, Input, Modal, Select, Tag, Tooltip } from "./ui";

export function WeekScreen({
  engagement,
  weeklyTarget,
  entries,
  onEntriesChange,
  events,
  onSaveEvents,
  onNonBillableTarget,
  onRestart,
}: {
  engagement: Engagement;
  weeklyTarget: number;
  entries: TrackedEntry[];
  onEntriesChange: (entries: TrackedEntry[]) => void;
  events: CalendarEvent[];
  onSaveEvents: (updated: CalendarEvent[]) => void;
  onNonBillableTarget: (value: number) => void;
  onRestart: () => void;
}) {
  const [planned, setPlanned] = useState(() => Number(engagement.includedHours) || 20);
  const [timeDrawer, setTimeDrawer] = useState(false);
  const [eventsDrawer, setEventsDrawer] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [targetOpen, setTargetOpen] = useState(false);
  const [targetDraft, setTargetDraft] = useState(String(engagement.nonBillableTarget));

  const rows = useMemo(() => [...engagement.projects, ...engagement.categories], [engagement]);

  const eventEntries: TrackedEntry[] = useMemo(
    () =>
      events
        .filter((e) => e.status === "ready")
        .map((e) => ({
          id: `ev-${e.id}`,
          description: e.title,
          rowId: e.categoryId || e.projectId,
          hours: e.hours,
          billable: e.billable,
        })),
    [events],
  );

  const all = useMemo(() => [...entries, ...eventEntries], [entries, eventEntries]);
  const tracked = all.reduce((s, e) => s + e.hours, 0);
  const pct = Math.min(100, Math.round((tracked / Math.max(planned, 1)) * 100));
  const overPace = tracked > planned * 0.8;

  const nonBillableHours = all.reduce(
    (s, e) => (entryBillable(engagement, e) === "billable" ? s : s + e.hours),
    0,
  );
  const nonBillablePct = tracked ? Math.round((nonBillableHours / tracked) * 100) : 0;
  const overTarget = nonBillablePct > engagement.nonBillableTarget;

  const byRow = useMemo(
    () =>
      rows.map((r) => ({
        row: r,
        hours: all.filter((e) => e.rowId === r.id).reduce((s, e) => s + e.hours, 0),
      })),
    [rows, all],
  );

  const delivery = byRow
    .filter(({ row }) => engagement.projects.some((p) => p.id === row.id))
    .reduce((s, r) => s + r.hours, 0);
  const admin = tracked - delivery;
  const businessAdmin = admin + 3.5; // simulated non-client business time
  const totalWeek = delivery + businessAdmin;

  const included = Number(engagement.includedHours) || 0;
  const fee = Number(engagement.amount) || 0;
  const represented = included ? Math.round(Math.min(1, tracked / included) * fee) : 0;
  const pendingEvents = events.filter((e) => e.status === "uncategorized").length;

  return (
    <div className="mx-auto max-w-[980px] px-6 py-8 md:px-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight text-foreground">This week</h1>
          <p className="mt-1 text-[11.5px] font-medium uppercase tracking-wide text-muted-foreground">
            Simulated end-of-week state
          </p>
          <p className="mt-0.5 text-[13.5px] text-muted-foreground">
            <span className="text-teal">{engagement.clientName || "Your client"}</span> · Friday preview of week one
          </p>
        </div>
        <button
          type="button"
          onClick={onRestart}
          className="text-[13px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Restart prototype
        </button>
      </header>

      <section className="rounded-[12px] border border-border px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="text-[16px] font-semibold text-foreground">
            {overPace ? "You’re using time faster than planned" : "You’re tracking within plan"}
          </h2>
          <Tag tone={overPace ? "warning" : "teal"}>{overPace ? "Needs attention" : "On track"}</Tag>
        </div>

        <p className="mt-2 text-[14px] text-foreground">
          {tracked.toFixed(1)} of {planned} planned hours used
        </p>
        <div
          className="mt-2 h-2 w-full rounded-full bg-secondary"
          role="img"
          aria-label={`${pct}% of planned hours used`}
        >
          <div className={`h-2 rounded-full ${overPace ? "bg-primary" : "bg-teal"}`} style={{ width: `${pct}%` }} />
        </div>

        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Breakdown</p>
          <ul className="space-y-1.5">
            {byRow.map(({ row, hours }) => (
              <li key={row.id} className="flex items-center justify-between text-[13.5px]">
                <span className="flex items-center gap-2 text-foreground">
                  <span className="h-2 w-2 rounded-full bg-teal" aria-hidden />
                  {row.name || "Untitled"}
                </span>
                <span className="tabular-nums text-muted-foreground">{hours.toFixed(1)}h</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setTimeDrawer(true)}>
            Review time
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            Add missed time
          </Button>
          <Button size="sm" onClick={() => setAdjustOpen(true)}>
            Adjust next week
          </Button>
        </div>
      </section>

      <div className="mt-4">
        <BurnForecast engagement={engagement} tracked={tracked} />
      </div>

      <section
        className={`mt-4 rounded-[12px] border px-5 py-4 ${overTarget ? "border-warning/40 bg-warning-soft/40" : "border-border"}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="text-[15.5px] font-semibold text-foreground">
            {overTarget ? "Non-billable time is above your target" : "Non-billable time is within your target"}
          </h2>
          <Tag tone={overTarget ? "warning" : "teal"}>{nonBillablePct}%</Tag>
        </div>
        <p className="mt-1.5 text-[14px] text-foreground">
          {nonBillableHours.toFixed(1)}h · {nonBillablePct}% of tracked time
        </p>
        <p className="mt-1 text-[13.5px] text-muted-foreground">
          Your target is {engagement.nonBillableTarget}%.{" "}
          {overTarget
            ? "Client communication and revisions account for most of the difference."
            : "Communication and revisions are inside the share you planned for."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setTimeDrawer(true)}>
            Review entries
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setTargetDraft(String(engagement.nonBillableTarget));
              setTargetOpen(true);
            }}
          >
            Adjust target
          </Button>
        </div>
      </section>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-border px-4 py-3">
          <p className="text-[13.5px] text-foreground">
            {pendingEvents} uncategorized {pendingEvents === 1 ? "event" : "events"}
          </p>
          <Button size="sm" onClick={() => setEventsDrawer(true)} disabled={pendingEvents === 0}>
            Review
          </Button>
        </div>
        <div className="rounded-[12px] border border-border px-4 py-3">
          <p className="flex flex-wrap items-center gap-1.5 text-[13.5px] text-foreground">
            {CURRENCY_SYMBOL[engagement.currency]}
            {represented.toLocaleString()} of {CURRENCY_SYMBOL[engagement.currency]}
            {fee.toLocaleString()} represented by tracked time
            <Tooltip text="Directional means an estimate based on tracked time only. It is not an invoice and does not confirm what you can bill." />
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">Directional, not an invoice</p>
        </div>
      </div>

      <section className="mt-4 rounded-[10px] border border-border bg-secondary/60 px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-[13.5px] font-semibold text-foreground">Your total week</h3>
          <span className="text-[12.5px] text-muted-foreground">
            {totalWeek.toFixed(1)}h of {weeklyTarget}h weekly working target
          </span>
        </div>
        <div className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-background">
          <div
            className="h-1.5 bg-teal"
            style={{ width: `${Math.min(100, (delivery / Math.max(weeklyTarget, 1)) * 100)}%` }}
          />
          <div
            className="h-1.5 bg-primary/50"
            style={{ width: `${Math.min(100, (businessAdmin / Math.max(weeklyTarget, 1)) * 100)}%` }}
          />
        </div>
        <p className="mt-2 text-[12.5px] text-muted-foreground">
          Client delivery {delivery.toFixed(1)}h · business administration and communication{" "}
          {businessAdmin.toFixed(1)}h. Friday preview based on simulated week-one activity.
        </p>
      </section>

      <TimeDrawer
        open={timeDrawer}
        onClose={() => setTimeDrawer(false)}
        engagement={engagement}
        entries={entries}
        onChange={onEntriesChange}
        extra={eventEntries}
      />

      <EventsDrawer
        open={eventsDrawer}
        onClose={() => setEventsDrawer(false)}
        engagement={engagement}
        events={events}
        onSave={onSaveEvents}
      />

      <AddMissedTime
        open={addOpen}
        rows={rows.map((r) => ({ id: r.id, name: r.name || "Untitled" }))}
        onClose={() => setAddOpen(false)}
        onAdd={(entry) => {
          onEntriesChange([...entries, { ...entry, id: Math.random().toString(36).slice(2, 8) }]);
          setAddOpen(false);
        }}
      />

      <Modal
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        title="Adjust next week"
        description="Change the hours you plan to work on this engagement."
      >
        <Field label="Planned hours">
          <Input
            inputMode="decimal"
            value={planned}
            onChange={(e) => setPlanned(Number(e.target.value.replace(/[^\d.]/g, "")) || 0)}
          />
        </Field>
        <p className="mt-2 text-[12.5px] text-muted-foreground">
          Tracked {tracked.toFixed(1)}h · {Math.min(100, Math.round((tracked / Math.max(planned, 1)) * 100))}% of plan
        </p>
        <div className="mt-4 flex justify-end">
          <Button variant="primary" onClick={() => setAdjustOpen(false)}>
            Save
          </Button>
        </div>
      </Modal>

      <Modal
        open={targetOpen}
        onClose={() => setTargetOpen(false)}
        title="Adjust non-billable target"
        description="The share of tracked engagement time you aim to keep outside billable delivery."
      >
        <Field label="Non-billable target (%)">
          <Input
            inputMode="decimal"
            value={targetDraft}
            onChange={(e) => setTargetDraft(e.target.value.replace(/[^\d.]/g, ""))}
          />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={() => setTargetOpen(false)}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              onNonBillableTarget(Number(targetDraft) || 0);
              setTargetOpen(false);
            }}
          >
            Save target
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function AddMissedTime({
  open,
  rows,
  onClose,
  onAdd,
}: {
  open: boolean;
  rows: { id: string; name: string }[];
  onClose: () => void;
  onAdd: (e: Omit<TrackedEntry, "id">) => void;
}) {
  const [description, setDescription] = useState("");
  const [rowId, setRowId] = useState("");
  const [hours, setHours] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const value = rowId || rows[0]?.id || "";

  return (
    <Modal open={open} onClose={onClose} title="Add missed time" description="Log work you forgot to track this week.">
      <div className="space-y-4">
        <Field label="Description">
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Design review" />
        </Field>
        <Field label="Project or category">
          <Select value={value} onChange={(e) => setRowId(e.target.value)}>
            {rows.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Hours">
          <Input inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value.replace(/[^\d.]/g, ""))} />
        </Field>
        {error && (
          <p role="alert" className="text-[13px] text-destructive">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!description.trim()) return setError("Add a short description.");
              const h = Number(hours);
              if (!h) return setError("Add the number of hours.");
              setError(null);
              onAdd({ description: description.trim(), rowId: value, hours: h, day: 4, start: 16 });
              setDescription("");
              setHours("1");
            }}
          >
            Add time
          </Button>
        </div>
      </div>
    </Modal>
  );
}

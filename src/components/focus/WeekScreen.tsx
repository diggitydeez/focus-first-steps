import { useMemo, useState } from "react";
import { CURRENCY_SYMBOL, type Engagement } from "@/lib/focus/extract";
import { Button, Field, Input, Modal, Select, Tag, Tooltip } from "./ui";

type Entry = { id: string; description: string; project: string; hours: number };

const INITIAL: Entry[] = [
  { id: "t1", description: "Homepage layout revisions", project: "Website Redesign", hours: 5.5 },
  { id: "t2", description: "Component build", project: "Website Redesign", hours: 4 },
  { id: "t3", description: "Data model review", project: "Analytics Dashboard", hours: 4.3 },
  { id: "t4", description: "Client check-in and revisions", project: "Client communication & revisions", hours: 4.2 },
];

export function WeekScreen({ engagement, onRestart }: { engagement: Engagement; onRestart: () => void }) {
  const [entries, setEntries] = useState<Entry[]>(INITIAL);
  const [planned, setPlanned] = useState(20);
  const [showEntries, setShowEntries] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const tracked = useMemo(() => entries.reduce((s, e) => s + e.hours, 0), [entries]);
  const pct = Math.min(100, Math.round((tracked / Math.max(planned, 1)) * 100));
  const commsHours = entries
    .filter((e) => /communicat|revision|admin/i.test(e.project))
    .reduce((s, e) => s + e.hours, 0);
  const commsPct = tracked ? Math.round((commsHours / tracked) * 100) : 0;
  const overPace = tracked > planned * 0.8;

  const byProject = useMemo(() => {
    const map = new Map<string, number>();
    entries.forEach((e) => map.set(e.project, (map.get(e.project) ?? 0) + e.hours));
    return [...map.entries()];
  }, [entries]);

  const included = Number(engagement.includedHours) || 30;
  const fee = Number(engagement.amount) || 2000;
  const represented = Math.round(Math.min(1, tracked / included) * fee);

  return (
    <div className="mx-auto max-w-[980px] px-6 py-8 md:px-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight text-foreground">This week</h1>
          <p className="mt-0.5 text-[13.5px] text-muted-foreground">
            <span className="text-teal">{engagement.clientName}</span> · Sep 7–11
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
        <div className="mt-2 h-2 w-full rounded-full bg-secondary" role="img" aria-label={`${pct}% of planned hours used`}>
          <div
            className={`h-2 rounded-full ${overPace ? "bg-primary" : "bg-teal"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2.5 text-[13.5px] text-muted-foreground">
          At this pace, you’ll reach the monthly allowance about 6 days early. This is an early commercial signal to
          check, not a judgement about your contract.
        </p>

        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Breakdown</p>
          <ul className="space-y-1.5">
            {byProject.map(([name, hours]) => (
              <li key={name} className="flex items-center justify-between text-[13.5px]">
                <span className="flex items-center gap-2 text-foreground">
                  <span className="h-2 w-2 rounded-full bg-teal" aria-hidden />
                  {name}
                </span>
                <span className="tabular-nums text-muted-foreground">{hours.toFixed(1)}h</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 rounded-[8px] bg-secondary px-3 py-2 text-[13px] text-foreground">
            {commsPct}% of this engagement was spent on communication and revisions.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setShowEntries((v) => !v)}>
            {showEntries ? "Hide entries" : "Review time"}
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            Add missed time
          </Button>
          <Button size="sm" onClick={() => setAdjustOpen(true)}>
            Adjust next week
          </Button>
        </div>

        {showEntries && (
          <div className="mt-4 divide-y divide-border rounded-[10px] border border-border">
            {entries.map((e) => (
              <div key={e.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                <input
                  aria-label="Entry description"
                  value={e.description}
                  onChange={(ev) =>
                    setEntries((list) =>
                      list.map((x) => (x.id === e.id ? { ...x, description: ev.target.value } : x)),
                    )
                  }
                  className="min-w-[160px] flex-1 bg-transparent text-[13.5px] focus:outline-none"
                />
                <span className="text-[12.5px] text-muted-foreground">{e.project}</span>
                <input
                  aria-label="Hours"
                  inputMode="decimal"
                  value={e.hours}
                  onChange={(ev) =>
                    setEntries((list) =>
                      list.map((x) =>
                        x.id === e.id ? { ...x, hours: Number(ev.target.value.replace(/[^\d.]/g, "")) || 0 } : x,
                      ),
                    )
                  }
                  className="w-16 rounded-[8px] border border-border px-2 py-1 text-right text-[13px] tabular-nums focus:border-primary focus:outline-none"
                />
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setEntries((list) => list.filter((x) => x.id !== e.id))}
                >
                  Remove
                </Button>
              </div>
            ))}
            {entries.length === 0 && <p className="px-3 py-4 text-[13px] text-muted-foreground">No entries yet.</p>}
          </div>
        )}
      </section>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-[12px] border border-border px-4 py-3">
          <p className="text-[13.5px] text-foreground">2 uncategorized events</p>
          <Button size="sm" onClick={() => setShowEntries(true)}>
            Review
          </Button>
        </div>
        <div className="rounded-[12px] border border-border px-4 py-3">
          <p className="flex items-center gap-1.5 text-[13.5px] text-foreground">
            {CURRENCY_SYMBOL[engagement.currency]}
            {represented.toLocaleString()} of {CURRENCY_SYMBOL[engagement.currency]}
            {fee.toLocaleString()} retainer represented by tracked time
            <Tooltip text="Directional means an estimate based on tracked time only. It is not an invoice and does not confirm what you can bill." />
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">Directional, not an invoice</p>
        </div>
      </div>

      <AddMissedTime
        open={addOpen}
        projects={[...engagement.projects.map((p) => p.name), ...engagement.categories.map((c) => c.name)]}
        onClose={() => setAddOpen(false)}
        onAdd={(entry) => {
          setEntries((list) => [...list, { ...entry, id: Math.random().toString(36).slice(2, 8) }]);
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
    </div>
  );
}

function AddMissedTime({
  open,
  projects,
  onClose,
  onAdd,
}: {
  open: boolean;
  projects: string[];
  onClose: () => void;
  onAdd: (e: Omit<Entry, "id">) => void;
}) {
  const [description, setDescription] = useState("");
  const [project, setProject] = useState(projects[0] ?? "");
  const [hours, setHours] = useState("1");
  const [error, setError] = useState<string | null>(null);

  return (
    <Modal open={open} onClose={onClose} title="Add missed time" description="Log work you forgot to track this week.">
      <div className="space-y-4">
        <Field label="Description">
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Design review" />
        </Field>
        <Field label="Project or category">
          <Select value={project} onChange={(e) => setProject(e.target.value)}>
            {projects.map((p) => (
              <option key={p} value={p}>
                {p}
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
              onAdd({ description: description.trim(), project, hours: h });
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

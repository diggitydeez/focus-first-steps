import { useState } from "react";
import { BILLING_LABEL, suggestProject, type Billable, type Engagement, type WorkRow } from "@/lib/focus/extract";
import { Button, Drawer, Field, Input, Select, Tag } from "./ui";

const BILLING_OPTS: { value: Billable; label: string }[] = [
  { value: "billable", label: "Billable" },
  { value: "non-billable", label: "Non-billable" },
  { value: "ask", label: "Ask each time" },
];

type Mode = "manual" | "ai" | null;

export function ProjectsScreen({
  engagement,
  onAddProject,
}: {
  engagement: Engagement;
  onAddProject: (row: WorkRow) => void;
}) {
  const [mode, setMode] = useState<Mode>(null);

  return (
    <div className="mx-auto max-w-[900px] px-6 py-8 md:px-10">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight text-foreground">Projects</h1>
          <p className="mt-0.5 text-[13.5px] text-muted-foreground">
            <span className="text-teal">{engagement.clientName}</span> · {BILLING_LABEL[engagement.billingModel]}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => setMode("manual")}>
            Add project
          </Button>
          <Button
            size="sm"
            onClick={() => setMode("ai")}
            className="border-accent-soft bg-accent-soft text-accent-foreground hover:bg-accent-soft/80"
          >
            <SparkleIcon /> Set up with AI
          </Button>
        </div>
      </header>

      <div className="divide-y divide-border rounded-[12px] border border-border">
        {engagement.projects.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className="h-2 w-2 shrink-0 rounded-full bg-teal" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] text-foreground">{p.name || "Untitled project"}</p>
              <p className="truncate text-[12.5px] text-muted-foreground">
                {engagement.clientName}
                {p.estimate ? ` · ${p.estimate}h estimate` : ""}
                {p.description ? ` · ${p.description}` : ""}
              </p>
            </div>
            <Tag tone={p.billable === "billable" ? "teal" : "neutral"}>
              {BILLING_OPTS.find((o) => o.value === p.billable)?.label}
            </Tag>
          </div>
        ))}
        {engagement.projects.length === 0 && (
          <p className="px-4 py-5 text-[13px] text-muted-foreground">No projects yet.</p>
        )}
      </div>

      <AddProjectDrawer
        mode={mode}
        engagement={engagement}
        onClose={() => setMode(null)}
        onCreate={(row) => {
          onAddProject(row);
          setMode(null);
        }}
      />
    </div>
  );
}

function AddProjectDrawer({
  mode,
  engagement,
  onClose,
  onCreate,
}: {
  mode: Mode;
  engagement: Engagement;
  onClose: () => void;
  onCreate: (row: WorkRow) => void;
}) {
  const [name, setName] = useState("");
  const [billable, setBillable] = useState<Billable>("billable");
  const [estimate, setEstimate] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const ai = mode === "ai";

  function suggest() {
    if (!description.trim()) return setError("Add a short description first.");
    const s = suggestProject(description);
    setName(s.name);
    setBillable(s.billable);
    if (s.estimate) setEstimate(s.estimate);
    setError(null);
  }

  function create() {
    if (!name.trim()) return setError("Give the project a name.");
    setError(null);
    onCreate({
      id: Math.random().toString(36).slice(2, 9),
      name: name.trim(),
      billable,
      suggested: ai,
      estimate: estimate.trim(),
      description: description.trim(),
    });
    setName("");
    setEstimate("");
    setDescription("");
    setBillable("billable");
  }

  return (
    <Drawer
      open={mode !== null}
      onClose={onClose}
      title={ai ? "Set up with AI" : "Add project"}
      description={
        ai
          ? "Describe the work and Focus suggests the fields. You can edit everything before creating."
          : "Adds to this engagement — no new onboarding needed."
      }
      footer={
        <div className="flex justify-end gap-2">
          <Button size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" onClick={create}>
            Create project
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {ai && (
          <>
            <Field label="Describe the project">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Landing page rebuild, roughly 12 hours"
                className="w-full rounded-[8px] border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none"
              />
            </Field>
            <Button
              size="sm"
              onClick={suggest}
              className="border-accent-soft bg-accent-soft text-accent-foreground hover:bg-accent-soft/80"
            >
              <SparkleIcon /> Suggest from description
            </Button>
          </>
        )}

        <Field label="Project name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" />
        </Field>
        <Field label="Client">
          <Select value={engagement.clientName} onChange={() => undefined}>
            <option value={engagement.clientName}>{engagement.clientName}</option>
          </Select>
        </Field>
        <Field label="Billing status">
          <Select value={billable} onChange={(e) => setBillable(e.target.value as Billable)}>
            {BILLING_OPTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Estimate / included hours">
          <Input
            inputMode="decimal"
            value={estimate}
            onChange={(e) => setEstimate(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder={engagement.includedHours || "0"}
          />
        </Field>
        {!ai && (
          <Field label="Description (optional)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Short note about the scope"
              className="w-full rounded-[8px] border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none"
            />
          </Field>
        )}
        {error && (
          <p role="alert" className="text-[13px] text-destructive">
            {error}
          </p>
        )}
      </div>
    </Drawer>
  );
}

function SparkleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 1.5l1.3 3.6 3.6 1.3-3.6 1.3L8 11.3 6.7 7.7 3.1 6.4l3.6-1.3L8 1.5z" fill="currentColor" />
      <path d="M12.6 10.4l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6.6-1.6z" fill="currentColor" />
    </svg>
  );
}

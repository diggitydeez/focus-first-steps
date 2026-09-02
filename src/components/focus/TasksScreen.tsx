import { useState } from "react";
import type { Engagement } from "@/lib/focus/extract";
import { Button, Field, Input, Modal, Select, Tag } from "./ui";

export type Task = { id: string; title: string; projectId: string; estimate: string; done: boolean };

export function TasksScreen({
  engagement,
  tasks,
  onChange,
}: {
  engagement: Engagement;
  tasks: Task[];
  onChange: (tasks: Task[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(engagement.projects[0]?.id ?? "");
  const [estimate, setEstimate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const projectName = (id: string) =>
    engagement.projects.find((p) => p.id === id)?.name || "Untitled project";

  function add() {
    if (!title.trim()) return setError("Give the task a name.");
    setError(null);
    onChange([
      ...tasks,
      {
        id: Math.random().toString(36).slice(2, 9),
        title: title.trim(),
        projectId: projectId || engagement.projects[0]?.id || "",
        estimate: estimate.trim(),
        done: false,
      },
    ]);
    setTitle("");
    setEstimate("");
    setOpen(false);
  }

  return (
    <div className="mx-auto max-w-[900px] px-6 py-8 md:px-10">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight text-foreground">Tasks</h1>
          <p className="mt-0.5 text-[13.5px] text-muted-foreground">
            <span className="text-teal">{engagement.clientName || "Your client"}</span> · work items inside this
            engagement
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setProjectId(engagement.projects[0]?.id ?? "");
            setOpen(true);
          }}
        >
          Add task
        </Button>
      </header>

      <div className="divide-y divide-border rounded-[12px] border border-border">
        {tasks.map((t) => (
          <label key={t.id} className="flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3">
            <input
              type="checkbox"
              checked={t.done}
              onChange={() => onChange(tasks.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))}
              className="h-4 w-4 accent-[var(--color-primary,#8b5cf6)]"
            />
            <div className="min-w-0 flex-1">
              <p className={`truncate text-[14px] ${t.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                {t.title}
              </p>
              <p className="truncate text-[12.5px] text-muted-foreground">
                {projectName(t.projectId)}
                {t.estimate ? ` · ${t.estimate}h estimate` : ""}
              </p>
            </div>
            <Tag tone={t.done ? "neutral" : "teal"}>{t.done ? "Done" : "Open"}</Tag>
          </label>
        ))}
        {tasks.length === 0 && (
          <p className="px-4 py-5 text-[13px] text-muted-foreground">
            No tasks yet. Add one to plan the week inside this engagement.
          </p>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add task" description="Adds a work item to a project in this engagement.">
        <div className="space-y-4">
          <Field label="Task name">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Draft homepage copy" />
          </Field>
          <Field label="Project">
            <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              {engagement.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || "Untitled project"}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Estimate (hours, optional)">
            <Input
              inputMode="decimal"
              value={estimate}
              onChange={(e) => setEstimate(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="2"
            />
          </Field>
          {error && (
            <p role="alert" className="text-[13px] text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={add}>
              Add task
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

import { useState } from "react";
import { cn } from "@/lib/utils";
import { OnboardingFrame } from "./OnboardingFrame";
import { Button } from "./ui";

const OPTIONS = [
  {
    id: "freelance",
    title: "Manage my freelance client work",
    copy: "Balance clients, projects and billable commitments.",
  },
  { id: "own", title: "Track my own time", copy: "See where my working day goes." },
  { id: "team", title: "Plan work for a team", copy: "Coordinate people and capacity." },
] as const;

export function IntentScreen({ onContinue, onSkip }: { onContinue: () => void; onSkip: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <OnboardingFrame
      step={1}
      title="What will you mainly use Focus for?"
      description="We’ll tailor your first experience to help you get useful time data this week."
      onSkip={onSkip}
    >
      <div role="radiogroup" aria-label="Primary use" className="space-y-2.5">
        {OPTIONS.map((o) => {
          const active = selected === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSelected(o.id)}
              className={cn(
                "flex w-full items-center gap-3.5 rounded-[10px] border px-4 py-3.5 text-left transition-colors",
                active ? "border-primary/40 bg-accent-tint" : "border-border bg-background hover:bg-secondary",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px]",
                  active ? "bg-accent-soft text-primary" : "bg-secondary text-muted-foreground",
                )}
              >
                <Icon id={o.id} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold text-foreground">{o.title}</span>
                <span className="block text-[13px] text-muted-foreground">{o.copy}</span>
              </span>
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px]",
                  active ? "border-primary bg-primary text-primary-foreground" : "border-border text-transparent",
                )}
                aria-hidden
              >
                ✓
              </span>
            </button>
          );
        })}
      </div>

      {selected && selected !== "freelance" && (
        <p className="mt-4 rounded-[8px] border border-border bg-secondary px-3 py-2 text-[13px] text-muted-foreground">
          This prototype only continues through the freelance client setup.
        </p>
      )}

      <div className="mt-7 flex items-center justify-end gap-3">
        <Button variant="primary" size="lg" disabled={selected !== "freelance"} onClick={onContinue}>
          Continue →
        </Button>
      </div>
    </OnboardingFrame>
  );
}

function Icon({ id }: { id: string }) {
  if (id === "freelance")
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M2.5 5.5h11v7h-11z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M6 5.5V4h4v1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  if (id === "own")
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="5.6" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 5v3.2l2 1.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="6" cy="6" r="2.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 13c0-2 1.6-3.4 3.5-3.4S9.5 11 9.5 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M11 5.2a2 2 0 010 3.6M12.4 13c0-1.4-.5-2.5-1.3-3.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

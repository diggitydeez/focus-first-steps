import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { SAMPLE_INPUT, extractEngagement, type Engagement } from "@/lib/focus/extract";
import { OnboardingFrame } from "./OnboardingFrame";
import { Button } from "./ui";

const MODES = [
  { id: "describe", label: "Describe it" },
  { id: "paste", label: "Paste notes" },
  { id: "upload", label: "Upload screenshot" },
] as const;
type Mode = (typeof MODES)[number]["id"];

const STEPS = ["Finding the client…", "Identifying billing terms…", "Creating a useful first-week structure…"];

export function SetupScreen({
  onBack,
  onSkip,
  onDone,
  onManual,
}: {
  onBack: () => void;
  onSkip: () => void;
  onDone: (e: Engagement, sourceText: string) => void;
  onManual: () => void;
}) {
  const [mode, setMode] = useState<Mode>("describe");
  const [text, setText] = useState(SAMPLE_INPUT);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!analyzing) return;
    const t1 = setTimeout(() => setStepIdx(1), 400);
    const t2 = setTimeout(() => setStepIdx(2), 800);
    const t3 = setTimeout(() => {
      const source = mode === "upload" ? SAMPLE_INPUT : text;
      onDone(extractEngagement(source), source);
    }, 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [analyzing, mode, text, onDone]);

  function analyze() {
    if (mode === "upload") {
      if (!fileName) {
        setError("Add a screenshot to analyse, or switch to “Describe it”.");
        return;
      }
    } else if (!text.trim()) {
      setError("Add a short description so Focus can propose a structure.");
      return;
    }
    setError(null);
    setStepIdx(0);
    setAnalyzing(true);
  }

  return (
    <OnboardingFrame
      step={2}
      title="Set up your first client engagement"
      description="Bring what you already know. Focus will propose a structure you can check before anything is created."
      onBack={onBack}
      onSkip={onSkip}
    >
      <div className="mb-4 inline-flex rounded-[9px] border border-border p-0.5" role="tablist" aria-label="Input mode">
        {MODES.map((m) => (
          <button
            key={m.id}
            role="tab"
            type="button"
            aria-selected={mode === m.id}
            onClick={() => {
              setMode(m.id);
              setError(null);
            }}
            className={cn(
              "h-8 rounded-[7px] px-3 text-[13px] font-medium transition-colors",
              mode === m.id ? "bg-accent-soft text-accent-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {analyzing ? (
        <div className="rounded-[10px] border border-border bg-secondary px-5 py-8">
          <div className="mx-auto max-w-sm space-y-2.5">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2.5 text-[14px]">
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full border text-[9px]",
                    i < stepIdx
                      ? "border-primary bg-primary text-primary-foreground"
                      : i === stepIdx
                        ? "animate-pulse border-primary text-transparent"
                        : "border-border text-transparent",
                  )}
                  aria-hidden
                >
                  ✓
                </span>
                <span className={i <= stepIdx ? "text-foreground" : "text-muted-foreground"}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      ) : mode === "upload" ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) {
              setFileName(f.name);
              setError(null);
            }
          }}
          className={cn(
            "rounded-[10px] border border-dashed px-6 py-10 text-center transition-colors",
            dragging ? "border-primary bg-accent-tint" : "border-border bg-secondary/60",
          )}
        >
          <p className="text-[14px] font-medium text-foreground">Drop a contract or brief screenshot</p>
          <p className="mt-1 text-[13px] text-muted-foreground">PNG or JPG. Nothing is uploaded in this prototype.</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setFileName(f.name);
                setError(null);
              }
            }}
          />
          <Button className="mt-4" onClick={() => fileRef.current?.click()}>
            Choose file
          </Button>
          {fileName && (
            <p className="mt-3 text-[13px] text-foreground">
              Selected: <span className="font-medium">{fileName}</span>
            </p>
          )}
        </div>
      ) : (
        <>
          <label htmlFor="engagement-text" className="mb-1.5 block text-[13px] font-medium text-foreground">
            {mode === "describe" ? "Describe the work" : "Paste your notes"}
          </label>
          <textarea
            id="engagement-text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(null);
            }}
            rows={6}
            className="w-full resize-y rounded-[10px] border border-border bg-background px-3.5 py-3 text-[14px] leading-relaxed text-foreground focus:border-primary focus:outline-none"
          />
          <p className="mt-1.5 text-[12px] text-muted-foreground">
            Example: “Monthly retainer of £1,500 for 15 hours with Harbour Co, split between SEO and reporting.”
          </p>
        </>
      )}

      {error && (
        <p role="alert" className="mt-3 text-[13px] text-destructive">
          {error}
        </p>
      )}

      <div className="mt-7 flex items-center justify-between gap-3">
        <Button variant="secondary" onClick={onManual} disabled={analyzing}>
          Set up manually
        </Button>
        <Button variant="primary" size="lg" onClick={analyze} disabled={analyzing}>
          {analyzing ? "Analysing…" : "Create suggested setup"}
        </Button>
      </div>
    </OnboardingFrame>
  );
}

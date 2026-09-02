import type { ReactNode } from "react";
import { Button, StepIndicator } from "./ui";

export function OnboardingFrame({
  step,
  title,
  description,
  children,
  onBack,
  onSkip,
  width = "max-w-[720px]",
}: {
  step: number;
  title: string;
  description: string;
  children: ReactNode;
  onBack?: () => void;
  onSkip: () => void;
  width?: string;
}) {
  return (
    <div className="min-h-screen bg-nav px-4 py-8">
      <div className={`mx-auto w-full ${width}`}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-primary">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M8 2v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M4.6 4.4a4.6 4.6 0 106.8 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
            <span className="text-[14px] font-semibold text-foreground">Focus</span>
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="rounded-[8px] px-2 py-1 text-[13px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Skip and start tracking
          </button>
        </div>

        <section className="rounded-[14px] border border-border bg-background px-8 py-8 md:px-10 md:py-10">
          <div className="mb-6 flex items-center justify-between">
            {onBack ? (
              <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
                ← Back
              </Button>
            ) : (
              <span />
            )}
            <StepIndicator step={step} total={3} />
          </div>

          <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-foreground">{title}</h1>
          <p className="mt-1.5 text-[14px] text-muted-foreground">{description}</p>

          <div className="mt-7">{children}</div>
        </section>
      </div>
    </div>
  );
}

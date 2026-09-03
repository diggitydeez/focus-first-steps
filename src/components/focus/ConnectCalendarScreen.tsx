import { useEffect, useRef, useState } from "react";
import { OnboardingFrame } from "./OnboardingFrame";
import { Button } from "./ui";

type Phase = "idle" | "connecting" | "connected";

/**
 * Simulated calendar connection step shown after the engagement is confirmed.
 * No OAuth, no provider settings — it only establishes where imported events came from.
 */
export function ConnectCalendarScreen({
  alreadyConnected,
  onBack,
  onConnect,
  onSkip,
  onContinue,
}: {
  alreadyConnected: boolean;
  onBack: () => void;
  /** Import the simulated events (idempotent: reconnecting must not duplicate). */
  onConnect: () => void;
  /** Continue without importing any calendar events. */
  onSkip: () => void;
  onContinue: () => void;
}) {
  const [phase, setPhase] = useState<Phase>(alreadyConnected ? "connected" : "idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function connect() {
    if (phase !== "idle") return;
    setPhase("connecting");
    timer.current = setTimeout(() => {
      onConnect();
      setPhase("connected");
    }, 900);
  }

  return (
    <OnboardingFrame
      step={3}
      title="Bring in your week"
      description="Connect your calendar to bring meetings and scheduled work into Focus. We’ll use the engagement structure you just confirmed to suggest where each event belongs. You stay in control before anything is categorized."
      onBack={onBack}
      onSkip={onSkip}
      width="max-w-[620px]"
    >
      <div className="rounded-[12px] border border-border bg-nav px-5 py-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border border-border bg-background text-primary">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <rect x="1.75" y="3" width="12.5" height="11.25" rx="2" stroke="currentColor" strokeWidth="1.4" />
              <path d="M1.75 6.5h12.5M5.25 1.75v2.5M10.75 1.75v2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14.5px] font-medium text-foreground">Google Calendar</p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {phase === "connected"
                ? "Calendar connected"
                : "Bring this week’s meetings and scheduled work into Focus."}
            </p>

            {phase === "connected" ? (
              <ul className="mt-3 space-y-1 text-[13px] text-foreground">
                <li>6 events found</li>
                <li>4 matched to your projects</li>
                <li className="text-muted-foreground">2 need your review</li>
              </ul>
            ) : null}
          </div>

          {phase !== "connected" ? (
            <Button size="sm" variant="primary" onClick={connect} disabled={phase === "connecting"}>
              {phase === "connecting" ? "Connecting…" : "Connect"}
            </Button>
          ) : null}
        </div>
      </div>

      <p className="mt-3 text-[12.5px] text-muted-foreground">
        Only calendar details needed for time review are used in this prototype.
      </p>

      <div className="mt-7 flex items-center justify-between">
        <button
          type="button"
          onClick={onSkip}
          className="rounded-[8px] px-1 py-1 text-[13px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Skip for now
        </button>
        {phase === "connected" ? (
          <Button variant="primary" onClick={onContinue}>
            Continue to Focus
          </Button>
        ) : null}
      </div>
    </OnboardingFrame>
  );
}

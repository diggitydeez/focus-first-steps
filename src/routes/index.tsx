import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { AppShell } from "@/components/focus/AppShell";
import { IntentScreen } from "@/components/focus/IntentScreen";
import { SetupScreen } from "@/components/focus/SetupScreen";
import { ReviewScreen } from "@/components/focus/ReviewScreen";
import { ReadyScreen } from "@/components/focus/ReadyScreen";
import { WeekScreen } from "@/components/focus/WeekScreen";
import { extractEngagement, newRow, SAMPLE_INPUT, type Engagement } from "@/lib/focus/extract";

const TITLE = "Focus Freelancer Activation — Set up your first client engagement";
const DESCRIPTION =
  "An interactive prototype: choose freelancer mode, describe one client engagement, review the suggested structure, start a tracked timer and preview week-one progress.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Screen = "intent" | "setup" | "review" | "ready" | "week";

function manualEngagement(): Engagement {
  return {
    clientName: "",
    clientConfirm: true,
    billingModel: "retainer",
    billingConfirm: true,
    amount: "",
    currency: "EUR",
    includedHours: "",
    period: "month",
    hoursConfirm: true,
    startDate: new Date().toISOString().slice(0, 10),
    projects: [newRow("")],
    categories: [{ ...newRow("Client communication & admin"), billable: "ask", suggested: true }],
  };
}

function Index() {
  const [screen, setScreen] = useState<Screen>("intent");
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [created, setCreated] = useState(false);

  const handleExtracted = useCallback((e: Engagement) => {
    setEngagement(e);
    setScreen("review");
  }, []);

  function skip() {
    setEngagement(extractEngagement(SAMPLE_INPUT));
    setCreated(false);
    setScreen("ready");
  }

  function restart() {
    setEngagement(null);
    setCreated(false);
    setScreen("intent");
  }

  if (screen === "intent") return <IntentScreen onContinue={() => setScreen("setup")} onSkip={skip} />;

  if (screen === "setup")
    return (
      <SetupScreen
        onBack={() => setScreen("intent")}
        onSkip={skip}
        onDone={handleExtracted}
        onManual={() => {
          setEngagement(manualEngagement());
          setScreen("review");
        }}
      />
    );

  if (screen === "review" && engagement)
    return (
      <ReviewScreen
        engagement={engagement}
        onChange={setEngagement}
        onBack={() => setScreen("setup")}
        onSkip={skip}
        onConfirm={() => {
          setCreated(true);
          setScreen("ready");
        }}
      />
    );

  const active = engagement ?? extractEngagement(SAMPLE_INPUT);

  return (
    <AppShell
      active={screen === "week" ? "reports" : "timer"}
      onNavigate={(key) => setScreen(key === "reports" ? "week" : "ready")}
    >
      {screen === "week" ? (
        <WeekScreen engagement={active} onRestart={restart} />
      ) : (
        <ReadyScreen
          engagement={active}
          created={created}
          onPreviewFriday={() => setScreen("week")}
          onBack={() => setScreen(created ? "review" : "intent")}
        />
      )}
    </AppShell>
  );
}

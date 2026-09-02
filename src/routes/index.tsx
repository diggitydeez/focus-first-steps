import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { AppShell } from "@/components/focus/AppShell";
import { IntentScreen } from "@/components/focus/IntentScreen";
import { SetupScreen } from "@/components/focus/SetupScreen";
import { ReviewScreen } from "@/components/focus/ReviewScreen";
import { ReadyScreen } from "@/components/focus/ReadyScreen";
import { ProjectsScreen } from "@/components/focus/ProjectsScreen";
import { WeekScreen } from "@/components/focus/WeekScreen";
import {
  DEFAULT_NON_BILLABLE_TARGET,
  DEFAULT_WEEKLY_TARGET,
  extractEngagement,
  newRow,
  SAMPLE_INPUT,
  seedEvents,
  type CalendarEvent,
  type Engagement,
  type WorkRow,
} from "@/lib/focus/extract";

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

type Screen = "intent" | "setup" | "review" | "ready" | "week" | "projects";

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
    nonBillableTarget: DEFAULT_NON_BILLABLE_TARGET,
    projects: [newRow("")],
    categories: [{ ...newRow("Client communication & admin"), billable: "ask", suggested: true }],
  };
}

function Index() {
  const [screen, setScreen] = useState<Screen>("intent");
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [weeklyTarget, setWeeklyTarget] = useState(DEFAULT_WEEKLY_TARGET);
  const [created, setCreated] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[] | null>(null);

  const handleExtracted = useCallback((e: Engagement) => {
    setEngagement(e);
    setScreen("review");
  }, []);

  function start(e: Engagement, wasCreated: boolean) {
    setEngagement(e);
    setEvents(seedEvents(e));
    setCreated(wasCreated);
    setScreen("ready");
  }

  function skip() {
    start(extractEngagement(SAMPLE_INPUT), false);
  }

  function restart() {
    setEngagement(null);
    setEvents(null);
    setCreated(false);
    setWeeklyTarget(DEFAULT_WEEKLY_TARGET);
    setScreen("intent");
  }

  const active = useMemo(() => engagement ?? extractEngagement(SAMPLE_INPUT), [engagement]);
  const activeEvents = events ?? seedEvents(active);

  const saveEvents = (updated: CalendarEvent[]) =>
    setEvents((list) =>
      (list ?? seedEvents(active)).map((e) => updated.find((u) => u.id === e.id) ?? e),
    );

  const addProject = (row: WorkRow) =>
    setEngagement((e) => (e ? { ...e, projects: [...e.projects, row] } : { ...active, projects: [...active.projects, row] }));

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
        weeklyTarget={weeklyTarget}
        onWeeklyTargetChange={setWeeklyTarget}
        onChange={setEngagement}
        onBack={() => setScreen("setup")}
        onSkip={skip}
        onConfirm={() => start(engagement, true)}
      />
    );

  return (
    <AppShell
      active={screen === "week" ? "reports" : screen === "projects" ? "projects" : "timer"}
      onNavigate={(key) =>
        setScreen(key === "reports" ? "week" : key === "projects" ? "projects" : key === "tasks" ? "projects" : "ready")
      }
    >
      {screen === "week" ? (
        <WeekScreen
          engagement={active}
          weeklyTarget={weeklyTarget}
          events={activeEvents}
          onSaveEvents={saveEvents}
          onNonBillableTarget={(value) => setEngagement({ ...active, nonBillableTarget: value })}
          onRestart={restart}
        />
      ) : screen === "projects" ? (
        <ProjectsScreen engagement={active} onAddProject={addProject} />
      ) : (
        <ReadyScreen
          engagement={active}
          created={created}
          events={activeEvents}
          onSaveEvents={saveEvents}
          onPreviewFriday={() => setScreen("week")}
          onBack={() => setScreen(created ? "review" : "intent")}
        />
      )}
    </AppShell>
  );
}


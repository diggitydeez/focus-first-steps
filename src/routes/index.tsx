import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/focus/AppShell";
import { IntentScreen } from "@/components/focus/IntentScreen";
import { SetupScreen } from "@/components/focus/SetupScreen";
import { ReviewScreen } from "@/components/focus/ReviewScreen";
import { ReadyScreen } from "@/components/focus/ReadyScreen";
import { ProjectsScreen } from "@/components/focus/ProjectsScreen";
import { TasksScreen, type Task } from "@/components/focus/TasksScreen";
import { CalendarScreen } from "@/components/focus/CalendarScreen";
import { WeekScreen } from "@/components/focus/WeekScreen";
import { EventsDrawer } from "@/components/focus/EventsDrawer";
import { TimeDrawer } from "@/components/focus/TimeDrawer";
import {
  DEFAULT_NON_BILLABLE_TARGET,
  DEFAULT_WEEKLY_TARGET,
  emptyTimer,
  extractEngagement,
  newRow,
  SAMPLE_INPUT,
  seedEntries,
  seedEvents,
  type CalendarEvent,
  type Engagement,
  type TimerState,
  type TrackedEntry,
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

const NB_TARGET_KEY = "focus.nonBillableTarget";
const SESSION_KEY = "focus.session";

type Screen = "intent" | "setup" | "review" | "connect" | "ready" | "week" | "projects" | "tasks" | "calendar";


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
  const [entries, setEntries] = useState<TrackedEntry[] | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timer, setTimer] = useState<TimerState>(() => emptyTimer(""));
  const [calEvents, setCalEvents] = useState(false);
  const [calEventFocus, setCalEventFocus] = useState<string | null>(null);
  const [calTime, setCalTime] = useState<string | null>(null);
  const [nonBillableTarget, setNonBillableTarget] = useState<number | null>(null);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(NB_TARGET_KEY);
    if (raw !== null && raw !== "" && !Number.isNaN(Number(raw))) setNonBillableTarget(Number(raw));

    // Restore a previously started workspace session (engagement + imported events).
    try {
      const saved = window.localStorage.getItem(SESSION_KEY);
      if (saved) {
        const s = JSON.parse(saved) as {
          engagement: Engagement;
          events: CalendarEvent[];
          entries: TrackedEntry[];
          tasks?: Task[];
          created?: boolean;
          weeklyTarget?: number;
          calendarConnected?: boolean;
        };
        if (s && s.engagement) {
          setEngagement(s.engagement);
          setEvents(s.events ?? []);
          setEntries(s.entries ?? []);
          setTasks(s.tasks ?? []);
          setCreated(Boolean(s.created));
          setWeeklyTarget(s.weeklyTarget ?? DEFAULT_WEEKLY_TARGET);
          setCalendarConnected(Boolean(s.calendarConnected));
          setTimer(emptyTimer(s.engagement.projects[0]?.id ?? ""));
          setScreen("ready");
        }
      }
    } catch {
      /* ignore malformed session */
    }
    setRestored(true);
  }, []);

  // Persist the workspace session so navigation and refresh keep imported events.
  useEffect(() => {
    if (!restored) return;
    if (!engagement || screen === "intent" || screen === "setup" || screen === "review") return;
    window.localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        engagement,
        events: events ?? [],
        entries: entries ?? [],
        tasks,
        created,
        weeklyTarget,
        calendarConnected,
      }),
    );
  }, [restored, screen, engagement, events, entries, tasks, created, weeklyTarget, calendarConnected]);

  const saveNonBillableTarget = useCallback((value: number) => {
    setNonBillableTarget(value);
    window.localStorage.setItem(NB_TARGET_KEY, String(value));
    setEngagement((prev) => (prev ? { ...prev, nonBillableTarget: value } : prev));
  }, []);

  const handleExtracted = useCallback((e: Engagement) => {
    setEngagement(e);
    setScreen("review");
  }, []);

  /** Prepare the workspace, then offer the calendar connection step. */
  function start(e: Engagement, wasCreated: boolean, goTo: Screen = "connect") {
    setEngagement(e);
    setEntries(seedEntries(e));
    setEvents((prev) => (calendarConnected ? (prev ?? seedEvents(e)) : []));
    setTimer(emptyTimer(e.projects[0]?.id ?? ""));
    setCreated(wasCreated);
    setScreen(goTo);
  }

  function skip() {
    start(extractEngagement(SAMPLE_INPUT), false, "ready");
  }

  /** Simulated import — replaces (never duplicates) the imported set. */
  function connectCalendar() {
    setCalendarConnected(true);
    setEvents(seedEvents(active));
  }

  function skipCalendar() {
    setCalendarConnected(false);
    setEvents([]);
    setScreen("ready");
  }

  function restart() {
    setEngagement(null);
    setEvents(null);
    setEntries(null);
    setTasks([]);
    setTimer(emptyTimer(""));
    setCreated(false);
    setWeeklyTarget(DEFAULT_WEEKLY_TARGET);
    setNonBillableTarget(null);
    setCalendarConnected(false);
    window.localStorage.removeItem(NB_TARGET_KEY);
    window.localStorage.removeItem(SESSION_KEY);
    setScreen("intent");
  }


  const active = useMemo(() => {
    const base = engagement ?? extractEngagement(SAMPLE_INPUT);
    return nonBillableTarget === null ? base : { ...base, nonBillableTarget };
  }, [engagement, nonBillableTarget]);
  const activeEvents = events ?? [];
  const activeEntries = entries ?? [];

  const saveEvents = (updated: CalendarEvent[]) =>
    setEvents((list) => (list ?? []).map((e) => updated.find((u) => u.id === e.id) ?? e));

  const addProject = (row: WorkRow) => {
    setEngagement({ ...active, projects: [...active.projects, row] });
    setTimer((t) => (t.projectId ? t : { ...t, projectId: row.id }));
  };

  function stopTimer() {
    const startedAt = timer.startedAt;
    if (!startedAt) return;
    const hours = Math.max(0.01, Math.round(((Date.now() - startedAt) / 3600000) * 100) / 100);
    const now = new Date();
    const day = Math.min(4, Math.max(0, now.getDay() - 1));
    setEntries((list) => [
      ...(list ?? []),
      {
        id: Math.random().toString(36).slice(2, 9),
        description: timer.description.trim() || "Untitled work",
        rowId: timer.categoryId || timer.projectId || active.projects[0]?.id || "",
        hours,
        billable: timer.billable ? "billable" : "non-billable",
        day,
        start: Math.min(18, Math.max(8, now.getHours())),
      },
    ]);
    setTimer({ ...timer, startedAt: null, description: "" });
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
        weeklyTarget={weeklyTarget}
        onWeeklyTargetChange={setWeeklyTarget}
        onChange={setEngagement}
        onBack={() => setScreen("setup")}
        onSkip={skip}
        onConfirm={() => start(engagement, true)}
      />
    );

  const navKey =
    screen === "week"
      ? "reports"
      : screen === "projects"
        ? "projects"
        : screen === "tasks"
          ? "tasks"
          : screen === "calendar"
            ? "calendar"
            : "timer";

  const running =
    timer.startedAt !== null
      ? {
          description: timer.description,
          rowId: timer.categoryId || timer.projectId,
          day: Math.min(4, Math.max(0, new Date().getDay() - 1)),
          start: Math.min(18, Math.max(8, new Date(timer.startedAt).getHours())),
          hours: Math.max(0.5, (Date.now() - timer.startedAt) / 3600000),
        }
      : null;

  return (
    <AppShell
      active={navKey}
      onNavigate={(key) =>
        setScreen(
          key === "reports"
            ? "week"
            : key === "projects"
              ? "projects"
              : key === "tasks"
                ? "tasks"
                : key === "calendar"
                  ? "calendar"
                  : "ready",
        )
      }
    >
      {screen === "week" ? (
        <WeekScreen
          engagement={active}
          weeklyTarget={weeklyTarget}
          entries={activeEntries}
          onEntriesChange={setEntries}
          events={activeEvents}
          onSaveEvents={saveEvents}
          onNonBillableTarget={saveNonBillableTarget}
          onRestart={restart}
        />
      ) : screen === "projects" ? (
        <ProjectsScreen engagement={active} onAddProject={addProject} />
      ) : screen === "tasks" ? (
        <TasksScreen engagement={active} tasks={tasks} onChange={setTasks} />
      ) : screen === "calendar" ? (
        <>
          <CalendarScreen
            engagement={active}
            entries={activeEntries}
            events={activeEvents}
            running={running}
            onOpenEvent={(id) => {
              setCalEventFocus(id);
              setCalEvents(true);
            }}
            onOpenEntry={(id) => setCalTime(id)}
          />
          <EventsDrawer
            open={calEvents}
            onClose={() => {
              setCalEvents(false);
              setCalEventFocus(null);
            }}
            engagement={active}
            events={activeEvents}
            onSave={saveEvents}
            focusId={calEventFocus ?? undefined}
          />
          <TimeDrawer
            open={calTime !== null}
            onClose={() => setCalTime(null)}
            engagement={active}
            entries={activeEntries}
            onChange={setEntries}
            focusId={calTime ?? undefined}
          />
        </>
      ) : (
        <ReadyScreen
          engagement={active}
          created={created}
          events={activeEvents}
          timer={timer}
          onTimerChange={setTimer}
          onStart={() => setTimer((t) => ({ ...t, startedAt: Date.now() }))}
          onStop={stopTimer}
          onSaveEvents={saveEvents}
          onPreviewFriday={() => setScreen("week")}
          onBack={() => setScreen(created ? "review" : "intent")}
        />
      )}
    </AppShell>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type NavKey = "timer" | "calendar" | "reports" | "projects" | "tasks";

const SECTIONS: { label: string; items: { key: NavKey; label: string; icon: ReactNode }[] }[] = [
  {
    label: "Track",
    items: [
      { key: "timer", label: "Timer", icon: <ClockIcon /> },
      { key: "calendar", label: "Calendar", icon: <CalendarIcon /> },
    ],
  },
  {
    label: "Analyze",
    items: [{ key: "reports", label: "Reports", icon: <BarIcon /> }],
  },
  {
    label: "Plan",
    items: [
      { key: "projects", label: "Projects", icon: <FolderIcon /> },
      { key: "tasks", label: "Tasks", icon: <ListIcon /> },
    ],
  },
];

export function AppShell({
  active,
  onNavigate,
  children,
}: {
  active: NavKey;
  onNavigate?: (key: NavKey) => void;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-[240px] shrink-0 flex-col border-r border-border bg-nav md:flex">
        <div className="flex items-center gap-2 px-4 py-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-primary">
            <PowerIcon />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-foreground">Focus</span>
        </div>

        <nav className="flex-1 px-2 py-2">
          {SECTIONS.map((section) => (
            <div key={section.label} className="mb-4">
              <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {section.label}
              </p>
              {section.items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  aria-current={active === item.key ? "page" : undefined}
                  onClick={() => onNavigate?.(item.key)}
                  className={cn(
                    "mb-0.5 flex w-full items-center gap-2.5 rounded-[8px] px-2 py-1.5 text-[14px] transition-colors",
                    active === item.key
                      ? "bg-accent-soft font-medium text-accent-foreground"
                      : "text-foreground hover:bg-secondary",
                  )}
                >
                  <span className={active === item.key ? "text-primary" : "text-muted-foreground"}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2 border-t border-border px-4 py-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-soft text-[11px] font-semibold text-teal">
            HR
          </span>
          <span className="text-[13px] text-muted-foreground">Freelance workspace</span>
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

function PowerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 2v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4.6 4.4a4.6 4.6 0 106.8 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 5v3.2l2 1.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function BarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 12V7M6.6 12V4M10.2 12V9M13.8 12V6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function FolderIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2.4 4.6h3.4l1 1.4h6.8v5.4a1 1 0 01-1 1H3.4a1 1 0 01-1-1V4.6z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ListIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M6 4.5h7M6 8h7M6 11.5h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="3" cy="4.5" r="1" fill="currentColor" />
      <circle cx="3" cy="8" r="1" fill="currentColor" />
      <circle cx="3" cy="11.5" r="1" fill="currentColor" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="3.5" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 6.5h12M5.5 2v2.5M10.5 2v2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

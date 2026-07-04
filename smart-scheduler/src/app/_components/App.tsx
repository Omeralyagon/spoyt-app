"use client";

import { useState } from "react";
import { SchedulerProvider, useScheduler } from "../_lib/store";
import { ManagerPage } from "./ManagerPage";
import { SchedulePage } from "./SchedulePage";
import { SettingsSheet } from "./SettingsSheet";
import { Sparkles, CalendarDays, Settings } from "lucide-react";

type Page = "manager" | "schedule";

function Shell() {
  const [page, setPage] = useState<Page>("manager");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { ready } = useScheduler();

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-24">
      {/* Slim header with settings */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-2 backdrop-blur">
        <span className="text-sm font-black tracking-tight">המתזמן החכם</span>
        <button
          onClick={() => setSettingsOpen(true)}
          aria-label="הגדרות"
          className="grid h-9 w-9 place-items-center rounded-full bg-muted text-muted-foreground active:scale-95 transition"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>

      <main className={ready ? "animate-[fade-up_0.4s_ease]" : "opacity-0"}>
        {page === "manager" ? <ManagerPage /> : <SchedulePage />}
      </main>

      {/* Fixed bottom navigation */}
      <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-border bg-card/95 backdrop-blur">
        <div className="grid grid-cols-2">
          <NavButton
            active={page === "manager"}
            onClick={() => setPage("manager")}
            icon={<Sparkles className="h-5 w-5" />}
            label="מנהל חכם"
          />
          <NavButton
            active={page === "schedule"}
            onClick={() => setPage("schedule")}
            icon={<CalendarDays className="h-5 w-5" />}
            label="המערכת שלי"
          />
        </div>
        <div style={{ height: "env(safe-area-inset-bottom)" }} />
      </nav>

      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-2.5 text-xs font-semibold transition ${
        active ? "text-primary" : "text-muted-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export function SchedulerApp() {
  return (
    <SchedulerProvider>
      <Shell />
    </SchedulerProvider>
  );
}

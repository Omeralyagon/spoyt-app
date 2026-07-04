"use client";

import { useState } from "react";
import { useScheduler } from "../_lib/store";
import type { DayAnalysis, EnrichedClass } from "../_lib/engine";
import type { DayOfWeek } from "../_lib/types";
import {
  DAY_NAMES,
  WEEK_ORDER,
  fromMinutes,
  hoursColon,
  humanDuration,
  shekels,
  TRANSPORT_ICON,
} from "../_lib/format";
import { Segmented, Card } from "./ui";
import { ClassDetailsSheet } from "./ClassDetailsSheet";
import { AddClassSheet } from "./AddClassSheet";
import { Plus, Home } from "lucide-react";

type ViewMode = "daily" | "weekly" | "monthly";

const CONN_STYLE = {
  efficient: { line: "bg-emerald-500", text: "text-emerald-600", label: "חיבור יעיל" },
  tight: { line: "bg-amber-500", text: "text-amber-600", label: "חיבור צפוף" },
  conflict: { line: "bg-rose-500", text: "text-rose-600", label: "לא תספיק להגיע" },
} as const;

export function SchedulePage() {
  const { week, state } = useScheduler();
  const [view, setView] = useState<ViewMode>("weekly");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const today = new Date().getDay() as DayOfWeek;
  const [activeDay, setActiveDay] = useState<DayOfWeek>(today);

  const activeDays = WEEK_ORDER.filter((d) => week.days[d].classes.length > 0);

  return (
    <div className="px-4 pt-6 pb-4">
      <header className="mb-4">
        <h1 className="mb-3 text-2xl font-black">המערכת שלי</h1>
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: "daily", label: "יומי" },
            { value: "weekly", label: "שבועי" },
            { value: "monthly", label: "חודשי" },
          ]}
        />
      </header>

      {view === "weekly" &&
        (activeDays.length ? (
          <div className="space-y-6">
            {activeDays.map((d) => (
              <DayBlock key={d} day={week.days[d]} onSelect={setSelectedClass} />
            ))}
          </div>
        ) : (
          <EmptyState />
        ))}

      {view === "daily" && (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {WEEK_ORDER.map((d) => (
              <button
                key={d}
                onClick={() => setActiveDay(d)}
                className={`shrink-0 rounded-full px-4 h-10 text-sm font-semibold border transition ${
                  activeDay === d
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border"
                }`}
              >
                {DAY_NAMES[d]}
              </button>
            ))}
          </div>
          {week.days[activeDay].classes.length ? (
            <DayBlock day={week.days[activeDay]} onSelect={setSelectedClass} hideTitle />
          ) : (
            <EmptyState small />
          )}
        </div>
      )}

      {view === "monthly" && <MonthlyView />}

      {/* Floating add button */}
      <button
        onClick={() => setAddOpen(true)}
        className="fixed bottom-24 left-1/2 z-30 flex h-14 -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-6 font-bold text-primary-foreground shadow-xl shadow-primary/30 active:scale-95 transition"
      >
        <Plus className="h-5 w-5" /> הוסף שיעור
      </button>

      <ClassDetailsSheet classId={selectedClass} onClose={() => setSelectedClass(null)} />
      <AddClassSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

function DayBlock({
  day,
  onSelect,
  hideTitle,
}: {
  day: DayAnalysis;
  onSelect: (id: string) => void;
  hideTitle?: boolean;
}) {
  return (
    <section>
      {!hideTitle && (
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-lg font-black">{DAY_NAMES[day.day]}</h2>
          <span className="text-xs text-muted-foreground">
            {day.classes.length} שיעורים · {shekels(day.income)} · {hoursColon(day.teachingMinutes)} הוראה ·{" "}
            {humanDuration(day.travelMinutes)} נסיעה
          </span>
        </div>
      )}

      <div className="space-y-2">
        {day.classes.map((ec, i) => (
          <div key={ec.session.id}>
            {i === 0 && (
              <div className="mb-2 flex items-center gap-2 px-1 text-xs text-muted-foreground">
                <Home className="h-3.5 w-3.5" />
                <span>יציאה מהבית ב־{fromMinutes(ec.departAt)}</span>
              </div>
            )}
            <ClassRow ec={ec} onSelect={onSelect} />
            {i < day.classes.length - 1 && <ConnectionStrip day={day} index={i} />}
          </div>
        ))}
      </div>
    </section>
  );
}

function ClassRow({ ec, onSelect }: { ec: EnrichedClass; onSelect: (id: string) => void }) {
  const s = ec.session;
  return (
    <Card className="flex items-center gap-3 p-3" onClick={() => onSelect(s.id)}>
      <div className="w-12 shrink-0 text-center">
        <div className="text-base font-black leading-none">{s.start_time}</div>
        <div className="mt-0.5 text-[10px] text-muted-foreground">{s.end_time}</div>
      </div>
      <div className="h-10 w-px bg-border" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold">{ec.studio?.name || "סטודיו"}</div>
        <div className="truncate text-sm text-muted-foreground">
          {s.class_type || s.class_name}
        </div>
      </div>
      <div className="shrink-0 text-left">
        <div className="font-bold">{shekels(s.payment)}</div>
        <div className="text-xs text-muted-foreground">{TRANSPORT_ICON[s.transportation_mode]}</div>
      </div>
    </Card>
  );
}

function ConnectionStrip({ day, index }: { day: DayAnalysis; index: number }) {
  const conn = day.connections[index];
  if (!conn) return null;
  const style = CONN_STYLE[conn.quality];
  const mode = day.classes[index + 1]?.session.transportation_mode ?? "bicycle";
  return (
    <div className="flex items-center gap-2 py-1.5 pr-4">
      <div className={`h-8 w-1 rounded-full ${style.line}`} />
      <div className="text-xs">
        <span className={`font-bold ${style.text}`}>
          {TRANSPORT_ICON[mode]} {conn.travelMinutes} דקות
        </span>
        <span className="mx-1.5 text-muted-foreground">·</span>
        {conn.quality === "conflict" ? (
          <span className={style.text}>חסרות כ־{Math.abs(conn.slackMinutes)} דקות</span>
        ) : (
          <span className="text-muted-foreground">צא ב־{fromMinutes(conn.departAt)}</span>
        )}
      </div>
    </div>
  );
}

function MonthlyView() {
  const { week } = useScheduler();
  const monthlyIncome = week.income * 4.33;
  const activeDays = WEEK_ORDER.filter((d) => week.days[d].classes.length > 0);
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="text-sm text-muted-foreground">הכנסה חודשית משוערת</div>
        <div className="text-3xl font-black">{shekels(monthlyIncome)}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          מבוסס על {week.totalClasses} שיעורים קבועים בשבוע
        </div>
      </Card>
      <div className="space-y-2">
        {activeDays.map((d) => (
          <Card key={d} className="flex items-center justify-between p-4">
            <span className="font-bold">{DAY_NAMES[d]}</span>
            <span className="text-sm text-muted-foreground">
              {week.days[d].classes.length} שיעורים · {shekels(week.days[d].income)}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ small }: { small?: boolean }) {
  return (
    <div className={`grid place-items-center text-center ${small ? "py-12" : "py-20"}`}>
      <div className="text-4xl">🗓️</div>
      <p className="mt-3 font-semibold">אין כאן שיעורים עדיין</p>
      <p className="text-sm text-muted-foreground">הוסף שיעור חדש עם הכפתור למטה</p>
    </div>
  );
}

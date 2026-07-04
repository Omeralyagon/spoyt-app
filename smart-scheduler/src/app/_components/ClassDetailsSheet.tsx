"use client";

import { useEffect, useState } from "react";
import { useScheduler } from "../_lib/store";
import { Sheet, Button, Field, TextInput, Chips } from "./ui";
import { FactRow } from "./ScoreResultView";
import {
  fromMinutes,
  toMinutes,
  humanDuration,
  shekels,
  TRANSPORT_LABEL,
  TRANSPORT_ICON,
} from "../_lib/format";
import { buildICS, downloadICS } from "../_lib/calendar";
import type { ClassSession, TransportMode } from "../_lib/types";
import { MapPin, Trash2, CalendarPlus, Pencil } from "lucide-react";

const TRANSPORTS: TransportMode[] = ["bicycle", "car", "walking", "public_transport"];

export function ClassDetailsSheet({
  classId,
  onClose,
}: {
  classId: string | null;
  onClose: () => void;
}) {
  const { state, week, updateClass, deleteClass } = useScheduler();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ClassSession | null>(null);

  const session = state.classes.find((c) => c.id === classId) || null;
  const studio = session ? state.studios.find((s) => s.id === session.studio_id) || null : null;

  // enriched info (travel + departure) from the week analysis
  const enriched = session
    ? week.days[session.day_of_week].classes.find((e) => e.session.id === session.id)
    : null;

  useEffect(() => {
    setEditing(false);
    setDraft(session ? { ...session } : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const saveEdit = () => {
    if (!draft) return;
    const endMin = toMinutes(draft.start_time) + draft.duration_minutes;
    updateClass({ ...draft, end_time: fromMinutes(endMin) });
    setEditing(false);
  };

  const addToCalendar = () => {
    if (!session) return;
    const ics = buildICS(session, studio, state.profile, new Date());
    downloadICS(`${session.class_name || "class"}.ics`, ics);
  };

  return (
    <Sheet open={!!classId} onClose={onClose} title={session?.class_name || "פרטי שיעור"}>
      {session && !editing && (
        <div className="space-y-4">
          {studio && (
            <div className="flex items-start gap-2 rounded-2xl bg-muted p-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <div className="font-bold">{studio.name}</div>
                <div className="text-sm text-muted-foreground">{studio.address}</div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border p-3">
            {session.class_type && <FactRow label="סוג שיעור" value={session.class_type} />}
            <FactRow label="שעת התחלה" value={session.start_time} />
            <FactRow label="שעת סיום" value={session.end_time} />
            <FactRow label="משך" value={humanDuration(session.duration_minutes)} />
            <FactRow label="תשלום" value={shekels(session.payment)} />
            <FactRow
              label="אמצעי הגעה"
              value={`${TRANSPORT_ICON[session.transportation_mode]} ${TRANSPORT_LABEL[session.transportation_mode]}`}
            />
            {enriched && (
              <>
                <FactRow label="זמן נסיעה משוער" value={humanDuration(enriched.travelInMinutes)} />
                <FactRow label="שעת יציאה מומלצת" value={fromMinutes(enriched.departAt)} />
              </>
            )}
          </div>

          {session.notes && (
            <div className="rounded-2xl bg-muted p-3 text-sm">{session.notes}</div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <Button variant="soft" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" /> עריכה
            </Button>
            <Button variant="soft" onClick={addToCalendar}>
              <CalendarPlus className="h-4 w-4" /> ליומן
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                deleteClass(session.id);
                onClose();
              }}
            >
              <Trash2 className="h-4 w-4" /> מחיקה
            </Button>
          </div>
        </div>
      )}

      {session && editing && draft && (
        <div className="space-y-4">
          <Field label="שם השיעור">
            <TextInput value={draft.class_name} onChange={(e) => setDraft({ ...draft, class_name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="שעת התחלה">
              <TextInput
                type="time"
                value={draft.start_time}
                onChange={(e) => setDraft({ ...draft, start_time: e.target.value })}
              />
            </Field>
            <Field label="תשלום (₪)">
              <TextInput
                type="number"
                value={draft.payment}
                onChange={(e) => setDraft({ ...draft, payment: Number(e.target.value) })}
              />
            </Field>
          </div>
          <Field label="משך (דקות)">
            <Chips
              value={String(draft.duration_minutes)}
              onChange={(v) => setDraft({ ...draft, duration_minutes: Number(v) })}
              options={[45, 60, 75, 90].map((d) => ({ value: String(d), label: `${d}` }))}
            />
          </Field>
          <Field label="אמצעי הגעה">
            <Chips
              value={draft.transportation_mode}
              onChange={(v) => setDraft({ ...draft, transportation_mode: v })}
              options={TRANSPORTS.map((t) => ({ value: t, label: `${TRANSPORT_ICON[t]} ${TRANSPORT_LABEL[t]}` }))}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="soft" onClick={() => setEditing(false)}>
              ביטול
            </Button>
            <Button onClick={saveEdit}>שמור</Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

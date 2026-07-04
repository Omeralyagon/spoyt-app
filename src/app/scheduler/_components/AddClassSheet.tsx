"use client";

import { useMemo, useState } from "react";
import { useScheduler } from "../_lib/store";
import { scoreOption } from "../_lib/scoring";
import {
  OptionForm,
  emptyOption,
  resolveOption,
  isOptionComplete,
  type OptionFormModel,
} from "./OptionForm";
import { Sheet, Button, Field, TextInput } from "./ui";
import { addMinutes, fromMinutes, toMinutes, humanDuration } from "../_lib/format";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import type { ClassOption } from "../_lib/types";

interface SaveResult {
  ok: boolean;
  message: string;
  suggestion?: string;
}

export function AddClassSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, addClass, addStudio } = useScheduler();
  const [form, setForm] = useState<OptionFormModel>(emptyOption(0));
  const [className, setClassName] = useState("");
  const [classType, setClassType] = useState("");
  const [recurring, setRecurring] = useState(true);
  const [saved, setSaved] = useState<SaveResult | null>(null);

  const reset = () => {
    setForm(emptyOption(0));
    setClassName("");
    setClassType("");
    setRecurring(true);
    setSaved(null);
  };
  const close = () => {
    onClose();
    setTimeout(reset, 300);
  };

  const option: ClassOption = useMemo(() => resolveOption(form, state.studios), [form, state.studios]);
  const canSave = isOptionComplete(form) && !!className.trim();

  const evaluate = (opt: ClassOption): SaveResult => {
    const res = scoreOption(opt, state.classes, state.studios, state.profile);
    const ctx = res.context;
    if (ctx.overlapConflict) {
      return { ok: false, message: "השיעור מתנגש עם שיעור קיים באותה שעה. בדוק את השעה." };
    }
    if (ctx.connectionConflict) {
      // find a shifted time that resolves it
      let suggestion: string | undefined;
      for (const delta of [15, 30, 45, 60]) {
        const cand = { ...opt, start_time: addMinutes(opt.start_time, delta) };
        if (!scoreOption(cand, state.classes, state.studios, state.profile).context.connectionConflict) {
          suggestion = `הצעה: נסה להזיז את השיעור ל־${addMinutes(opt.start_time, delta)}.`;
          break;
        }
      }
      return {
        ok: false,
        message: `השיעור נוסף, אבל הזמן להגיע מהשיעור הסמוך צפוף מדי — הנסיעה לבדה לוקחת כ־${humanDuration(ctx.travelInMinutes)}.`,
        suggestion,
      };
    }
    return { ok: true, message: "השיעור נוסף והלו״ז נראה מצוין." };
  };

  const doSave = () => {
    let studioId = option.studio_id;
    if (!studioId && form.studioId === "new") {
      const created = addStudio({
        name: form.newStudioName,
        address: form.address,
        latitude: option.latitude,
        longitude: option.longitude,
        parking_cost: 0,
      });
      studioId = created.id;
    }
    if (!studioId) return;
    const endMin = toMinutes(option.start_time) + option.duration_minutes;
    addClass({
      studio_id: studioId,
      class_name: className,
      class_type: classType,
      day_of_week: option.day_of_week,
      start_time: option.start_time,
      end_time: fromMinutes(endMin),
      duration_minutes: option.duration_minutes,
      payment: option.payment,
      transportation_mode: option.transportation_mode,
      is_recurring: recurring,
      status: "active",
    });
    setSaved(evaluate(option));
  };

  return (
    <Sheet open={open} onClose={close} title="הוסף שיעור">
      {!saved && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="שם השיעור">
              <TextInput value={className} onChange={(e) => setClassName(e.target.value)} placeholder="ויניאסה בוקר" />
            </Field>
            <Field label="סוג שיעור">
              <TextInput value={classType} onChange={(e) => setClassType(e.target.value)} placeholder="יוגה / פילאטיס" />
            </Field>
          </div>

          <OptionForm form={form} studios={state.studios} onChange={setForm} />

          <button
            type="button"
            onClick={() => setRecurring((v) => !v)}
            className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3"
          >
            <span className="font-semibold">שיעור קבוע (שבועי)</span>
            <span
              className={`relative h-7 w-12 rounded-full transition ${recurring ? "bg-primary" : "bg-muted"}`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
                  recurring ? "right-1" : "right-6"
                }`}
              />
            </span>
          </button>

          <Button onClick={doSave} disabled={!canSave} className="w-full">
            הוסף למערכת
          </Button>
        </div>
      )}

      {saved && (
        <div className="space-y-5 py-4 text-center">
          <div
            className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${
              saved.ok ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
            }`}
          >
            {saved.ok ? <CheckCircle2 className="h-9 w-9" /> : <AlertTriangle className="h-9 w-9" />}
          </div>
          <p className="text-[16px] font-semibold leading-relaxed">{saved.message}</p>
          {saved.suggestion && (
            <p className="rounded-2xl bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
              {saved.suggestion}
            </p>
          )}
          <Button onClick={close} className="w-full">
            סגור
          </Button>
        </div>
      )}
    </Sheet>
  );
}

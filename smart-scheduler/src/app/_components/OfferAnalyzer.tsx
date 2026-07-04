"use client";

import { useMemo, useState } from "react";
import { useScheduler } from "../_lib/store";
import { analyzeOffer, type OfferResult } from "../_lib/analysis";
import {
  OptionForm,
  emptyOption,
  resolveOption,
  isOptionComplete,
  type OptionFormModel,
} from "./OptionForm";
import { Sheet, Button } from "./ui";
import { SingleScore, FactRow } from "./ScoreResultView";
import { humanDuration, shekels } from "../_lib/format";
import { Check, Clock, X } from "lucide-react";

const VERDICT_STYLE = {
  take: { bg: "bg-emerald-500/10", text: "text-emerald-600", Icon: Check },
  shift_time: { bg: "bg-amber-500/10", text: "text-amber-600", Icon: Clock },
  not_worth: { bg: "bg-rose-500/10", text: "text-rose-600", Icon: X },
} as const;

export function OfferAnalyzer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, addClass, addStudio, saveOffer } = useScheduler();
  const [form, setForm] = useState<OptionFormModel>(emptyOption(0));
  const [result, setResult] = useState<OfferResult | null>(null);

  const reset = () => {
    setForm(emptyOption(0));
    setResult(null);
  };
  const close = () => {
    onClose();
    setTimeout(reset, 300);
  };

  const option = useMemo(() => resolveOption(form, state.studios), [form, state.studios]);
  const canCheck = isOptionComplete(form);

  const check = (startTime?: string) => {
    const target = startTime ? { ...option, start_time: startTime } : option;
    setResult(analyzeOffer(target, state.classes, state.studios, state.profile));
    if (startTime) setForm({ ...form, startTime });
  };

  const ensureStudio = (): string | null => {
    if (option.studio_id) return option.studio_id;
    if (form.studioId === "new") {
      const created = addStudio({
        name: form.newStudioName,
        address: form.address,
        latitude: option.latitude,
        longitude: option.longitude,
        parking_cost: 0,
      });
      return created.id;
    }
    return null;
  };

  const addToSchedule = () => {
    const studioId = ensureStudio();
    if (!studioId) return;
    const [sh, sm] = option.start_time.split(":").map(Number);
    const endMin = sh * 60 + sm + option.duration_minutes;
    addClass({
      studio_id: studioId,
      class_name: form.newStudioName || "שיעור חדש",
      class_type: "",
      day_of_week: option.day_of_week,
      start_time: option.start_time,
      end_time: `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`,
      duration_minutes: option.duration_minutes,
      payment: option.payment,
      transportation_mode: option.transportation_mode,
      is_recurring: false,
      status: "active",
    });
    close();
  };

  const keepAsOffer = () => {
    if (!result) return;
    saveOffer({
      ...option,
      status: "pending",
      analysis_score: result.score,
      recommendation: result.headline,
      recommendation_reason: result.message,
    });
    close();
  };

  return (
    <Sheet open={open} onClose={close} title="בדיקת הצעת שיעור">
      {!result && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">קיבלת הצעה? בוא נבדוק אם היא באמת משתלמת.</p>
          <OptionForm form={form} studios={state.studios} onChange={setForm} />
          <Button onClick={() => check()} disabled={!canCheck} className="w-full">
            בדוק בשבילי
          </Button>
        </div>
      )}

      {result && (
        <div className="space-y-5">
          <VerdictCard result={result} />
          <SingleScore score={result.score} />
          <p className="text-[15px] leading-relaxed">{result.message}</p>

          <div className="rounded-2xl border border-border p-3">
            <FactRow label="תשלום" value={shekels(option.payment)} />
            <FactRow label="נסיעה נוספת" value={humanDuration(result.base.context.addedTravelMinutes)} />
            <FactRow label="שכר אפקטיבי" value={`${shekels(result.base.context.effectiveRate)}/שעה`} />
            <FactRow label="זמן מת שנוצר" value={humanDuration(result.base.context.deadCreatedMinutes)} />
            {result.base.context.nearestClassKm !== null && (
              <FactRow label="מרחק משיעור סמוך" value={`${result.base.context.nearestClassKm} ק״מ`} />
            )}
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Button onClick={addToSchedule} className="w-full">
              הוסף למערכת
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="soft" onClick={keepAsOffer}>
                שמור כהצעה
              </Button>
              {result.suggestedTime ? (
                <Button variant="ghost" onClick={() => check(result.suggestedTime)}>
                  בדוק את {result.suggestedTime}
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => setResult(null)}>
                  בדוק שעה אחרת
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}

function VerdictCard({ result }: { result: OfferResult }) {
  const s = VERDICT_STYLE[result.verdict];
  const Icon = s.Icon;
  return (
    <div className={`flex items-center gap-3 rounded-2xl p-4 ${s.bg}`}>
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-card ${s.text}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className={`text-xl font-black ${s.text}`}>{result.headline}</div>
    </div>
  );
}

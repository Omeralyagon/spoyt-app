"use client";

import { useMemo, useState } from "react";
import { useScheduler } from "../_lib/store";
import { compareOptions, type DecisionResult } from "../_lib/analysis";
import {
  OptionForm,
  emptyOption,
  resolveOption,
  isOptionComplete,
  type OptionFormModel,
} from "./OptionForm";
import { Sheet, Button, Segmented } from "./ui";
import { TwoScores, FactRow } from "./ScoreResultView";
import { humanDuration, shekels } from "../_lib/format";
import type { ClassOption } from "../_lib/types";

const COMPARE_TYPES = [
  "שני שיעורים חדשים",
  "החלפת שיעור",
  "שתי שעות שונות",
  "שני ימים שונים",
  "שני סטודיואים",
  "אחר",
];

type Step = "type" | "options" | "result";

export function DecisionAssistant({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, addClass, addStudio, saveDecision } = useScheduler();
  const [step, setStep] = useState<Step>("type");
  const [compareType, setCompareType] = useState(COMPARE_TYPES[0]);
  const [tab, setTab] = useState<"a" | "b">("a");
  const [formA, setFormA] = useState<OptionFormModel>(emptyOption(0));
  const [formB, setFormB] = useState<OptionFormModel>(emptyOption(0));
  const [result, setResult] = useState<DecisionResult | null>(null);

  const reset = () => {
    setStep("type");
    setCompareType(COMPARE_TYPES[0]);
    setTab("a");
    setFormA(emptyOption(0));
    setFormB(emptyOption(0));
    setResult(null);
  };

  const close = () => {
    onClose();
    setTimeout(reset, 300);
  };

  const canCompare = isOptionComplete(formA) && isOptionComplete(formB);

  const optionA = useMemo(() => resolveOption(formA, state.studios), [formA, state.studios]);
  const optionB = useMemo(() => resolveOption(formB, state.studios), [formB, state.studios]);

  const runCompare = () => {
    const res = compareOptions(optionA, optionB, state.classes, state.studios, state.profile);
    setResult(res);
    setStep("result");
  };

  const acceptOption = (which: "a" | "b") => {
    const form = which === "a" ? formA : formB;
    const opt = which === "a" ? optionA : optionB;
    let studioId = opt.studio_id;
    if (!studioId && form.studioId === "new") {
      const created = addStudio({
        name: form.newStudioName,
        address: form.address,
        latitude: opt.latitude,
        longitude: opt.longitude,
        parking_cost: 0,
      });
      studioId = created.id;
    }
    if (!studioId) return;
    const [sh, sm] = opt.start_time.split(":").map(Number);
    const endMin = sh * 60 + sm + opt.duration_minutes;
    addClass({
      studio_id: studioId,
      class_name: form.newStudioName || compareType,
      class_type: "",
      day_of_week: opt.day_of_week,
      start_time: opt.start_time,
      end_time: `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`,
      duration_minutes: opt.duration_minutes,
      payment: opt.payment,
      transportation_mode: opt.transportation_mode,
      is_recurring: false,
      status: "active",
    });
    close();
  };

  const persist = () => {
    if (!result) return;
    saveDecision({
      title: compareType,
      option_a_data: optionA,
      option_b_data: optionB,
      option_a_score: result.a.score,
      option_b_score: result.b.score,
      recommended_option: result.recommended,
      recommendation_reason: result.reason,
    });
    close();
  };

  return (
    <Sheet open={open} onClose={close} title="יש לי התלבטות">
      {step === "type" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">מה אתה משווה?</p>
          <div className="grid grid-cols-2 gap-2">
            {COMPARE_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setCompareType(t)}
                className={`rounded-2xl border p-3 text-sm font-semibold transition active:scale-[0.98] ${
                  compareType === t
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-card text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <Button onClick={() => setStep("options")} className="w-full">
            המשך
          </Button>
        </div>
      )}

      {step === "options" && (
        <div className="space-y-4">
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: "a", label: "אפשרות א׳" },
              { value: "b", label: "אפשרות ב׳" },
            ]}
          />
          {tab === "a" ? (
            <OptionForm form={formA} studios={state.studios} onChange={setFormA} />
          ) : (
            <OptionForm form={formB} studios={state.studios} onChange={setFormB} />
          )}
          <Button onClick={runCompare} disabled={!canCompare} className="w-full">
            מה עדיף לי?
          </Button>
          {!canCompare && (
            <p className="text-center text-xs text-muted-foreground">
              מלא את שתי האפשרויות כדי להשוות
            </p>
          )}
        </div>
      )}

      {step === "result" && result && (
        <div className="space-y-5">
          <div className="rounded-2xl bg-primary/10 p-4 text-center">
            <div className="text-sm text-muted-foreground">ההמלצה שלי</div>
            <div className="text-2xl font-black text-primary">
              אני ממליץ על אפשרות {result.recommended === "a" ? "א׳" : "ב׳"}
            </div>
          </div>

          <TwoScores aScore={result.a.score} bScore={result.b.score} recommended={result.recommended} />

          <p className="text-[15px] leading-relaxed">{result.reason}</p>

          <div className="rounded-2xl border border-border p-3">
            <div className="mb-1 text-xs font-bold text-muted-foreground">אפשרות א׳</div>
            <FactRow label="תשלום" value={shekels(optionA.payment)} />
            <FactRow label="נסיעה נוספת" value={humanDuration(result.a.context.addedTravelMinutes)} />
            <FactRow label="שכר אפקטיבי" value={`${shekels(result.a.context.effectiveRate)}/שעה`} />
            <div className="my-2 border-t border-border" />
            <div className="mb-1 text-xs font-bold text-muted-foreground">אפשרות ב׳</div>
            <FactRow label="תשלום" value={shekels(optionB.payment)} />
            <FactRow label="נסיעה נוספת" value={humanDuration(result.b.context.addedTravelMinutes)} />
            <FactRow label="שכר אפקטיבי" value={`${shekels(result.b.context.effectiveRate)}/שעה`} />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Button onClick={() => acceptOption(result.recommended)} className="w-full">
              בחר אפשרות {result.recommended === "a" ? "א׳" : "ב׳"}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="soft" onClick={() => setStep("options")}>
                ערוך אפשרויות
              </Button>
              <Button variant="ghost" onClick={persist}>
                שמור החלטה
              </Button>
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}

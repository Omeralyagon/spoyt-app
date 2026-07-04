"use client";

import { useScheduler } from "../_lib/store";
import { Sheet, Button, Field, TextInput, Chips } from "./ui";
import { PRIORITY_LABEL, TRANSPORT_ICON, TRANSPORT_LABEL } from "../_lib/format";
import type { OptimizationPriority, TransportMode } from "../_lib/types";

const TRANSPORTS: TransportMode[] = ["bicycle", "car", "walking", "public_transport"];
const PRIORITIES: OptimizationPriority[] = ["maximum_income", "minimum_travel", "smart_balance"];

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3"
    >
      <span className="font-semibold">{label}</span>
      <span className={`relative h-7 w-12 rounded-full transition ${value ? "bg-primary" : "bg-muted"}`}>
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${value ? "right-1" : "right-6"}`}
        />
      </span>
    </button>
  );
}

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, updateProfile, resetDemo } = useScheduler();
  const p = state.profile;

  return (
    <Sheet open={open} onClose={onClose} title="הגדרות">
      <div className="space-y-4">
        <Field label="שם">
          <TextInput value={p.full_name} onChange={(e) => updateProfile({ full_name: e.target.value })} />
        </Field>
        <Field label="כתובת הבית">
          <TextInput value={p.home_address} onChange={(e) => updateProfile({ home_address: e.target.value })} />
        </Field>

        <Field label="סדר עדיפויות">
          <Chips
            value={p.optimization_priority}
            onChange={(v) => updateProfile({ optimization_priority: v })}
            options={PRIORITIES.map((x) => ({ value: x, label: PRIORITY_LABEL[x] }))}
          />
        </Field>

        <Field label="אמצעי הגעה מועדף">
          <Chips
            value={p.default_transportation_mode}
            onChange={(v) => updateProfile({ default_transportation_mode: v })}
            options={TRANSPORTS.map((t) => ({ value: t, label: `${TRANSPORT_ICON[t]} ${TRANSPORT_LABEL[t]}` }))}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="מרווח ביטחון (דקות)">
            <TextInput
              type="number"
              value={p.travel_buffer_minutes}
              onChange={(e) => updateProfile({ travel_buffer_minutes: Number(e.target.value) })}
            />
          </Field>
          <Field label="זמן מעבר (דקות)">
            <TextInput
              type="number"
              value={p.transition_time_minutes}
              onChange={(e) => updateProfile({ transition_time_minutes: Number(e.target.value) })}
            />
          </Field>
        </div>

        <Toggle
          label="סנכרון אוטומטי ליומן"
          value={p.calendar_sync_enabled}
          onChange={(v) => updateProfile({ calendar_sync_enabled: v })}
        />
        <Toggle
          label="כלול תשלום ביומן"
          value={p.include_payment_in_calendar}
          onChange={(v) => updateProfile({ include_payment_in_calendar: v })}
        />

        <div className="pt-2">
          <Button variant="ghost" className="w-full" onClick={resetDemo}>
            אפס לנתוני הדגמה
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

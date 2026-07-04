"use client";

import type { ClassOption, DayOfWeek, Studio, TransportMode } from "../_lib/types";
import { geocodeAddress } from "../_lib/geo";
import { DAY_NAMES_SHORT, TRANSPORT_ICON, TRANSPORT_LABEL } from "../_lib/format";
import { Field, TextInput, SelectInput, Chips } from "./ui";

export interface OptionFormModel {
  studioId: string | "new" | "";
  newStudioName: string;
  address: string;
  day: DayOfWeek;
  startTime: string;
  duration: number;
  payment: number;
  transport: TransportMode;
}

export function emptyOption(day: DayOfWeek = 0): OptionFormModel {
  return {
    studioId: "",
    newStudioName: "",
    address: "",
    day,
    startTime: "18:00",
    duration: 60,
    payment: 180,
    transport: "bicycle",
  };
}

/** Resolve a form model to a ClassOption with coordinates. */
export function resolveOption(form: OptionFormModel, studios: Studio[]): ClassOption {
  const existing = studios.find((s) => s.id === form.studioId);
  const loc = existing
    ? { latitude: existing.latitude, longitude: existing.longitude }
    : geocodeAddress(form.address || form.newStudioName);
  return {
    studio_id: existing ? existing.id : null,
    address: existing ? existing.address : form.address,
    latitude: loc.latitude,
    longitude: loc.longitude,
    day_of_week: form.day,
    start_time: form.startTime,
    duration_minutes: form.duration,
    payment: form.payment,
    transportation_mode: form.transport,
  };
}

export function isOptionComplete(form: OptionFormModel): boolean {
  const hasPlace = !!form.studioId && (form.studioId !== "new" || !!form.newStudioName.trim());
  return hasPlace && !!form.startTime && form.duration > 0 && form.payment > 0;
}

const DAYS: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];
const DURATIONS = [45, 60, 75, 90];
const TRANSPORTS: TransportMode[] = ["bicycle", "car", "walking", "public_transport"];

export function OptionForm({
  form,
  studios,
  onChange,
}: {
  form: OptionFormModel;
  studios: Studio[];
  onChange: (next: OptionFormModel) => void;
}) {
  const set = (patch: Partial<OptionFormModel>) => onChange({ ...form, ...patch });

  return (
    <div className="space-y-4">
      <Field label="סטודיו">
        <SelectInput
          value={form.studioId}
          onChange={(e) => {
            const v = e.target.value;
            const st = studios.find((s) => s.id === v);
            set({ studioId: v, address: st ? st.address : form.address });
          }}
        >
          <option value="">בחר סטודיו…</option>
          {studios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
          <option value="new">➕ סטודיו חדש</option>
        </SelectInput>
      </Field>

      {form.studioId === "new" && (
        <div className="grid grid-cols-1 gap-3">
          <Field label="שם הסטודיו">
            <TextInput
              value={form.newStudioName}
              onChange={(e) => set({ newStudioName: e.target.value })}
              placeholder="לדוגמה: Zen Studio"
            />
          </Field>
          <Field label="כתובת">
            <TextInput
              value={form.address}
              onChange={(e) => set({ address: e.target.value })}
              placeholder="רחוב, עיר"
            />
          </Field>
        </div>
      )}

      <Field label="יום">
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => set({ day: d })}
              className={`grid h-11 w-11 place-items-center rounded-full text-sm font-bold border transition active:scale-95 ${
                form.day === d
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border"
              }`}
            >
              {DAY_NAMES_SHORT[d]}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="שעת התחלה">
          <TextInput type="time" value={form.startTime} onChange={(e) => set({ startTime: e.target.value })} />
        </Field>
        <Field label="תשלום (₪)">
          <TextInput
            type="number"
            inputMode="numeric"
            value={form.payment}
            onChange={(e) => set({ payment: Number(e.target.value) })}
          />
        </Field>
      </div>

      <Field label="משך (דקות)">
        <Chips
          value={String(form.duration)}
          onChange={(v) => set({ duration: Number(v) })}
          options={DURATIONS.map((d) => ({ value: String(d), label: `${d}` }))}
        />
      </Field>

      <Field label="אמצעי הגעה">
        <Chips
          value={form.transport}
          onChange={(v) => set({ transport: v })}
          options={TRANSPORTS.map((t) => ({
            value: t,
            label: `${TRANSPORT_ICON[t]} ${TRANSPORT_LABEL[t]}`,
          }))}
        />
      </Field>
    </div>
  );
}

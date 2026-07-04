import type { DayOfWeek, TransportMode, OptimizationPriority } from "./types";

export const DAY_NAMES: Record<DayOfWeek, string> = {
  0: "יום ראשון",
  1: "יום שני",
  2: "יום שלישי",
  3: "יום רביעי",
  4: "יום חמישי",
  5: "יום שישי",
  6: "יום שבת",
};

export const DAY_NAMES_SHORT: Record<DayOfWeek, string> = {
  0: "א׳",
  1: "ב׳",
  2: "ג׳",
  3: "ד׳",
  4: "ה׳",
  5: "ו׳",
  6: "ש׳",
};

export const WEEK_ORDER: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];

export const TRANSPORT_LABEL: Record<TransportMode, string> = {
  bicycle: "אופניים",
  car: "רכב",
  walking: "הליכה",
  public_transport: "תחבורה ציבורית",
};

export const TRANSPORT_ICON: Record<TransportMode, string> = {
  bicycle: "🚲",
  car: "🚗",
  walking: "🚶",
  public_transport: "🚌",
};

export const PRIORITY_LABEL: Record<OptimizationPriority, string> = {
  maximum_income: "מקסימום הכנסה",
  minimum_travel: "מינימום נסיעות",
  smart_balance: "איזון חכם",
};

/** "HH:MM" -> minutes since midnight. */
export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** minutes since midnight -> "HH:MM". */
export function fromMinutes(total: number): string {
  const t = ((total % 1440) + 1440) % 1440;
  const h = Math.floor(t / 60);
  const m = t % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function addMinutes(time: string, delta: number): string {
  return fromMinutes(toMinutes(time) + delta);
}

/** e.g. 160 -> "2:40 שעות" ; 45 -> "45 דקות". */
export function humanDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m} דקות`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return `${h}:${String(rem).padStart(2, "0")} שעות`;
}

/** Compact hours label for summaries: 160 -> "2:40". */
export function hoursColon(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return `${h}:${String(rem).padStart(2, "0")}`;
}

export function shekels(amount: number): string {
  return `₪${Math.round(amount).toLocaleString("he-IL")}`;
}

export function greeting(hour: number): string {
  if (hour >= 5 && hour < 12) return "בוקר טוב";
  if (hour >= 12 && hour < 17) return "צהריים טובים";
  if (hour >= 17 && hour < 22) return "ערב טוב";
  return "לילה טוב";
}

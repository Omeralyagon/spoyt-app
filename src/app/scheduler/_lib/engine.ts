import type {
  ClassSession,
  DayOfWeek,
  Studio,
  UserProfile,
} from "./types";
import { estimateTravelMinutes, type LatLng } from "./geo";
import { toMinutes } from "./format";

// ---------------------------------------------------------------------------
// The deterministic schedule engine. Every number the UI shows about travel,
// income, gaps, conflicts and effective rate is produced here — never by AI.
// ---------------------------------------------------------------------------

export type ConnectionQuality = "efficient" | "tight" | "conflict";

export interface Connection {
  fromClassId: string;
  toClassId: string;
  travelMinutes: number;
  /** gap between prev end and next start */
  gapMinutes: number;
  /** gap - travel - transition; negative = impossible */
  slackMinutes: number;
  /** time that is stuck/unusable between the two classes */
  deadMinutes: number;
  quality: ConnectionQuality;
  /** recommended time to leave the previous class location */
  departAt: number; // minutes since midnight
}

export interface EnrichedClass {
  session: ClassSession;
  studio: Studio | null;
  location: LatLng;
  startMin: number;
  endMin: number;
  /** travel from the previous stop (home or previous class) to this class */
  travelInMinutes: number;
  /** recommended departure time (minutes since midnight) */
  departAt: number;
  /** true if the arrival is impossible given the previous class */
  arrivalImpossible: boolean;
}

export interface DayAnalysis {
  day: DayOfWeek;
  classes: EnrichedClass[];
  connections: Connection[];
  income: number;
  teachingMinutes: number;
  travelMinutes: number;
  deadMinutes: number;
  hasConflict: boolean;
}

export interface WeekAnalysis {
  days: DayAnalysis[];
  totalClasses: number;
  income: number;
  teachingMinutes: number;
  travelMinutes: number;
  deadMinutes: number;
  effectiveHourly: number;
  incomeByStudio: { studioId: string; name: string; income: number }[];
  incomeByType: { type: string; income: number }[];
}

const TIGHT_THRESHOLD = 15; // minutes of slack below which a link is "tight"
const DEAD_WINDOW = 45; // small gaps count as unavoidable dead time

function locationOf(
  session: ClassSession,
  studios: Studio[]
): LatLng {
  const s = studios.find((x) => x.id === session.studio_id);
  if (s) return { latitude: s.latitude, longitude: s.longitude };
  return { latitude: 32.0785, longitude: 34.7818 };
}

/** Analyse a single day's active classes. */
export function analyzeDay(
  day: DayOfWeek,
  allClasses: ClassSession[],
  studios: Studio[],
  profile: UserProfile
): DayAnalysis {
  const home: LatLng = { latitude: profile.home_lat, longitude: profile.home_lng };
  const dayClasses = allClasses
    .filter((c) => c.day_of_week === day && c.status === "active")
    .sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time));

  const enriched: EnrichedClass[] = [];
  const connections: Connection[] = [];

  let travelMinutes = 0;
  let teachingMinutes = 0;
  let income = 0;
  let deadMinutes = 0;
  let hasConflict = false;

  dayClasses.forEach((session, i) => {
    const studio = studios.find((s) => s.id === session.studio_id) || null;
    const location = locationOf(session, studios);
    const startMin = toMinutes(session.start_time);
    const endMin = toMinutes(session.end_time);
    teachingMinutes += session.duration_minutes;
    income += session.payment;

    const prev = i > 0 ? enriched[i - 1] : null;
    const origin = prev ? prev.location : home;
    const travelIn = estimateTravelMinutes(origin, location, session.transportation_mode);
    travelMinutes += travelIn;

    let arrivalImpossible = false;
    let departAt = startMin - travelIn - profile.travel_buffer_minutes;

    if (prev) {
      const gap = startMin - prev.endMin;
      const slack = gap - travelIn - profile.transition_time_minutes;
      const earliestDepart = prev.endMin + profile.transition_time_minutes;
      departAt = Math.max(earliestDepart, startMin - travelIn - profile.travel_buffer_minutes);
      const dead = gap > travelIn && gap - travelIn <= DEAD_WINDOW ? gap - travelIn : 0;
      deadMinutes += dead;

      let quality: ConnectionQuality;
      if (slack < 0) {
        quality = "conflict";
        arrivalImpossible = true;
        hasConflict = true;
      } else if (slack < TIGHT_THRESHOLD) {
        quality = "tight";
      } else {
        quality = "efficient";
      }

      connections.push({
        fromClassId: prev.session.id,
        toClassId: session.id,
        travelMinutes: travelIn,
        gapMinutes: gap,
        slackMinutes: slack,
        deadMinutes: dead,
        quality,
        departAt,
      });
    }

    enriched.push({
      session,
      studio,
      location,
      startMin,
      endMin,
      travelInMinutes: travelIn,
      departAt,
      arrivalImpossible,
    });
  });

  // Return trip home after the last class of the day.
  if (enriched.length > 0) {
    const last = enriched[enriched.length - 1];
    travelMinutes += estimateTravelMinutes(last.location, home, last.session.transportation_mode);
  }

  return {
    day,
    classes: enriched,
    connections,
    income,
    teachingMinutes,
    travelMinutes,
    deadMinutes,
    hasConflict,
  };
}

/** Analyse the whole recurring week. */
export function analyzeWeek(
  classes: ClassSession[],
  studios: Studio[],
  profile: UserProfile
): WeekAnalysis {
  const days: DayAnalysis[] = [];
  for (let d = 0 as DayOfWeek; d <= 6; d = (d + 1) as DayOfWeek) {
    days.push(analyzeDay(d, classes, studios, profile));
  }

  const income = days.reduce((s, d) => s + d.income, 0);
  const teachingMinutes = days.reduce((s, d) => s + d.teachingMinutes, 0);
  const travelMinutes = days.reduce((s, d) => s + d.travelMinutes, 0);
  const deadMinutes = days.reduce((s, d) => s + d.deadMinutes, 0);
  const totalClasses = days.reduce(
    (s, d) => s + d.classes.length,
    0
  );

  // Effective hourly income: payment over relevant time invested. Travel is
  // already counted once per segment (inter-class routes are shared, not
  // double-counted, because analyzeDay walks classes in order).
  const investedMinutes = teachingMinutes + travelMinutes + deadMinutes;
  const effectiveHourly = investedMinutes > 0 ? (income / investedMinutes) * 60 : 0;

  const byStudio = new Map<string, number>();
  const byType = new Map<string, number>();
  for (const d of days) {
    for (const ec of d.classes) {
      byStudio.set(ec.session.studio_id, (byStudio.get(ec.session.studio_id) || 0) + ec.session.payment);
      byType.set(ec.session.class_type, (byType.get(ec.session.class_type) || 0) + ec.session.payment);
    }
  }

  const incomeByStudio = [...byStudio.entries()]
    .map(([studioId, inc]) => ({
      studioId,
      name: studios.find((s) => s.id === studioId)?.name || "סטודיו",
      income: inc,
    }))
    .sort((a, b) => b.income - a.income);

  const incomeByType = [...byType.entries()]
    .map(([type, inc]) => ({ type, income: inc }))
    .sort((a, b) => b.income - a.income);

  return {
    days,
    totalClasses,
    income,
    teachingMinutes,
    travelMinutes,
    deadMinutes,
    effectiveHourly,
    incomeByStudio,
    incomeByType,
  };
}

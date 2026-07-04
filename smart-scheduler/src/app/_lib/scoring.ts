import type {
  ClassOption,
  ClassSession,
  OptimizationPriority,
  Studio,
  UserProfile,
} from "./types";
import { estimateTravelMinutes, haversineKm, type LatLng } from "./geo";
import { toMinutes } from "./format";

// ---------------------------------------------------------------------------
// Deterministic option scoring (0–100). Used by the decision assistant and the
// offer analyzer. AI never produces the score — it only explains it.
// ---------------------------------------------------------------------------

export type FactorKey =
  | "income"
  | "effectiveHourly"
  | "travelEfficiency"
  | "scheduleDensity"
  | "geographicProximity"
  | "workloadBalance";

const WEIGHTS: Record<OptimizationPriority, Partial<Record<FactorKey, number>>> = {
  maximum_income: {
    income: 0.45,
    effectiveHourly: 0.3,
    travelEfficiency: 0.1,
    scheduleDensity: 0.1,
    workloadBalance: 0.05,
  },
  minimum_travel: {
    travelEfficiency: 0.45,
    geographicProximity: 0.25,
    income: 0.15,
    scheduleDensity: 0.1,
    workloadBalance: 0.05,
  },
  smart_balance: {
    income: 0.25,
    effectiveHourly: 0.25,
    travelEfficiency: 0.2,
    scheduleDensity: 0.15,
    geographicProximity: 0.1,
    workloadBalance: 0.05,
  },
};

export interface ScoreContext {
  travelInMinutes: number; // from previous stop (home/prev class) to option
  travelOutMinutes: number; // from option to next stop (next class/home)
  addedTravelMinutes: number; // extra travel this option introduces
  effectiveRate: number; // ₪/hour for this option incl. attributed travel
  deadCreatedMinutes: number;
  nearestClassKm: number | null;
  dayTeachingMinutesBefore: number;
  overlapConflict: boolean;
  connectionConflict: boolean; // makes a neighbouring link impossible
  transportCost: number;
  parkingCost: number;
}

export interface ScoreResult {
  score: number; // 0–100
  factors: Record<FactorKey, number>;
  context: ScoreContext;
}

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Linearly map value in [min,max] to [0,100] (or reversed). */
function normalize(value: number, min: number, max: number, invert = false): number {
  const t = (value - min) / (max - min);
  const pct = clamp(t * 100);
  return invert ? 100 - pct : pct;
}

function locationOf(o: ClassOption): LatLng {
  return { latitude: o.latitude, longitude: o.longitude };
}

// Per-mode variable cost (₪ per km) used for transport-cost awareness.
const COST_PER_KM: Record<string, number> = {
  car: 1.6,
  public_transport: 0.6,
  bicycle: 0,
  walking: 0,
};

export function scoreOption(
  option: ClassOption,
  classes: ClassSession[],
  studios: Studio[],
  profile: UserProfile
): ScoreResult {
  const home: LatLng = { latitude: profile.home_lat, longitude: profile.home_lng };
  const optLoc = locationOf(option);
  const optStart = toMinutes(option.start_time);
  const optEnd = optStart + option.duration_minutes;

  const sameDay = classes
    .filter((c) => c.day_of_week === option.day_of_week && c.status === "active")
    .sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time));

  const locFor = (c: ClassSession): LatLng => {
    const s = studios.find((x) => x.id === c.studio_id);
    return s ? { latitude: s.latitude, longitude: s.longitude } : home;
  };

  // Neighbours around the option's time slot.
  const prev = [...sameDay].reverse().find((c) => toMinutes(c.end_time) <= optStart) || null;
  const next = sameDay.find((c) => toMinutes(c.start_time) >= optEnd) || null;

  const overlapConflict = sameDay.some((c) => {
    const s = toMinutes(c.start_time);
    const e = toMinutes(c.end_time);
    return optStart < e && s < optEnd;
  });

  const originLoc = prev ? locFor(prev) : home;
  const destLoc = next ? locFor(next) : home;
  const travelIn = estimateTravelMinutes(originLoc, optLoc, option.transportation_mode);
  const travelOut = estimateTravelMinutes(optLoc, destLoc, option.transportation_mode);

  // Baseline travel that already existed between prev and next (the segment the
  // option splits). Counting the difference avoids double-charging shared route.
  const baseline = prev && next
    ? estimateTravelMinutes(locFor(prev), locFor(next), option.transportation_mode)
    : prev
      ? estimateTravelMinutes(locFor(prev), home, option.transportation_mode)
      : next
        ? estimateTravelMinutes(home, locFor(next), option.transportation_mode)
        : estimateTravelMinutes(home, optLoc, option.transportation_mode) * 2;
  const addedTravel = Math.max(0, travelIn + travelOut - baseline);

  // Connection feasibility with neighbours.
  let connectionConflict = false;
  if (prev) {
    const slack = optStart - toMinutes(prev.end_time) - travelIn - profile.transition_time_minutes;
    if (slack < 0) connectionConflict = true;
  }
  if (next) {
    const slack = toMinutes(next.start_time) - optEnd - travelOut - profile.transition_time_minutes;
    if (slack < 0) connectionConflict = true;
  }

  // Dead time this option creates on either side (small unusable gaps).
  const deadBefore = prev
    ? Math.max(0, Math.min(45, optStart - toMinutes(prev.end_time) - travelIn))
    : 0;
  const deadAfter = next
    ? Math.max(0, Math.min(45, toMinutes(next.start_time) - optEnd - travelOut))
    : 0;
  const deadCreated = deadBefore + deadAfter;

  // Effective hourly rate for this option, attributing added travel.
  const investedHours = (option.duration_minutes + addedTravel + deadCreated) / 60;
  const effectiveRate = investedHours > 0 ? option.payment / investedHours : option.payment;

  // Geographic proximity to nearest same-day class.
  const nearestKm = sameDay.length
    ? Math.min(...sameDay.map((c) => haversineKm(optLoc, locFor(c))))
    : null;

  const dayTeachingBefore = sameDay.reduce((s, c) => s + c.duration_minutes, 0);

  const studio = option.studio_id ? studios.find((s) => s.id === option.studio_id) : null;
  const distanceKmForCost = haversineKm(originLoc, optLoc) + haversineKm(optLoc, destLoc);
  const transportCost = Math.round(distanceKmForCost * (COST_PER_KM[option.transportation_mode] ?? 0));
  const parkingCost = option.transportation_mode === "car" ? studio?.parking_cost ?? 0 : 0;

  // --- Factor scores (0–100) ---
  const factors: Record<FactorKey, number> = {
    income: normalize(option.payment, 60, 350),
    effectiveHourly: normalize(effectiveRate, 40, 250),
    travelEfficiency: normalize(addedTravel, 0, 110, true),
    scheduleDensity: densityScore(prev, next, optStart, optEnd, profile),
    geographicProximity:
      nearestKm === null
        ? normalize(haversineKm(home, optLoc), 0, 10, true)
        : normalize(nearestKm, 0, 8, true),
    workloadBalance: normalize(dayTeachingBefore + option.duration_minutes, 120, 420, true),
  };

  const weights = WEIGHTS[profile.optimization_priority];
  let score = 0;
  let totalWeight = 0;
  for (const [key, w] of Object.entries(weights) as [FactorKey, number][]) {
    score += factors[key] * w;
    totalWeight += w;
  }
  score = totalWeight > 0 ? score / totalWeight : 0;

  // Hard penalties for real problems.
  if (connectionConflict) score *= 0.55;
  if (overlapConflict) score = Math.min(score, 18);

  return {
    score: Math.round(clamp(score)),
    factors,
    context: {
      travelInMinutes: travelIn,
      travelOutMinutes: travelOut,
      addedTravelMinutes: addedTravel,
      effectiveRate: Math.round(effectiveRate),
      deadCreatedMinutes: deadCreated,
      nearestClassKm: nearestKm === null ? null : Math.round(nearestKm * 10) / 10,
      dayTeachingMinutesBefore: dayTeachingBefore,
      overlapConflict,
      connectionConflict,
      transportCost,
      parkingCost,
    },
  };
}

function densityScore(
  prev: ClassSession | null,
  next: ClassSession | null,
  optStart: number,
  optEnd: number,
  profile: UserProfile
): number {
  if (!prev && !next) return 35; // isolated class = dedicated round trip
  let best = 0;
  if (prev) {
    const gap = optStart - toMinutes(prev.end_time);
    best = Math.max(best, normalize(gap, 0, 180, true));
  }
  if (next) {
    const gap = toMinutes(next.start_time) - optEnd;
    best = Math.max(best, normalize(gap, 0, 180, true));
  }
  return best;
}

export { WEIGHTS };

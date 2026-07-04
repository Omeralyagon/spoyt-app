import type {
  ClassOption,
  ClassSession,
  Studio,
  UserProfile,
} from "./types";
import { scoreOption, type ScoreResult } from "./scoring";
import { fromMinutes, humanDuration, shekels, toMinutes } from "./format";

// ---------------------------------------------------------------------------
// Higher-level analysers that turn deterministic scores into a plain-Hebrew
// recommendation for the Decision Assistant and the Offer Analyzer.
// ---------------------------------------------------------------------------

export interface DecisionResult {
  a: ScoreResult;
  b: ScoreResult;
  recommended: "a" | "b";
  reason: string;
}

export function compareOptions(
  optionA: ClassOption,
  optionB: ClassOption,
  classes: ClassSession[],
  studios: Studio[],
  profile: UserProfile
): DecisionResult {
  const a = scoreOption(optionA, classes, studios, profile);
  const b = scoreOption(optionB, classes, studios, profile);
  const recommended = b.score >= a.score ? "b" : "a";

  const win = recommended === "a" ? a : b;
  const lose = recommended === "a" ? b : a;
  const winOpt = recommended === "a" ? optionA : optionB;
  const loseOpt = recommended === "a" ? optionB : optionA;
  const label = recommended === "a" ? "א׳" : "ב׳";

  const parts: string[] = [];
  const payDiff = winOpt.payment - loseOpt.payment;
  const travelDiff = lose.context.addedTravelMinutes - win.context.addedTravelMinutes;

  if (payDiff < 0 && travelDiff > 0) {
    parts.push(
      `למרות שהתשלום נמוך ב־${shekels(Math.abs(payDiff))}, אפשרות ${label} תחסוך לך ${humanDuration(travelDiff)} נסיעה ותשפר את השכר האפקטיבי שלך.`
    );
  } else if (payDiff > 0 && travelDiff >= 0) {
    parts.push(
      `אפשרות ${label} גם משלמת ${shekels(payDiff)} יותר וגם חוסכת ${humanDuration(Math.max(0, travelDiff))} נסיעה.`
    );
  } else if (travelDiff > 0) {
    parts.push(
      `אפשרות ${label} חוסכת לך ${humanDuration(travelDiff)} נסיעה ומשאירה אותך עם שכר אפקטיבי גבוה יותר.`
    );
  } else if (win.context.effectiveRate > lose.context.effectiveRate) {
    parts.push(
      `אפשרות ${label} נותנת שכר אפקטיבי של ${shekels(win.context.effectiveRate)} לשעה מול ${shekels(lose.context.effectiveRate)} — עדיפה על הזמן שלך.`
    );
  } else {
    parts.push(`אפשרות ${label} מקבלת ציון גבוה יותר לפי סדר העדיפויות שבחרת.`);
  }

  if (lose.context.connectionConflict && !win.context.connectionConflict) {
    parts.push(`בנוסף, האפשרות השנייה יוצרת חיבור נסיעה בעייתי בלו״ז.`);
  }

  return { a, b, recommended, reason: parts.join(" ") };
}

export type OfferVerdict = "take" | "shift_time" | "not_worth";

export interface OfferResult {
  verdict: OfferVerdict;
  headline: string; // "לקחת" / "לנסות לשנות שעה" / "לא משתלם"
  message: string;
  score: number;
  suggestedTime?: string;
  base: ScoreResult;
}

const HEADLINE: Record<OfferVerdict, string> = {
  take: "לקחת",
  shift_time: "לנסות לשנות שעה",
  not_worth: "לא משתלם",
};

export function analyzeOffer(
  offer: ClassOption,
  classes: ClassSession[],
  studios: Studio[],
  profile: UserProfile
): OfferResult {
  const base = scoreOption(offer, classes, studios, profile);
  const ctx = base.context;

  // Clear win: good score, no feasibility problem.
  if (base.score >= 68 && !ctx.connectionConflict && !ctx.overlapConflict) {
    const near =
      ctx.nearestClassKm !== null
        ? `השיעור נמצא כ־${ctx.travelInMinutes} דקות מהשיעור הסמוך שלך`
        : `השיעור משתלב יפה ביום`;
    return {
      verdict: "take",
      headline: HEADLINE.take,
      message: `${near} ומשפר את ההכנסה היומית בלי ליצור זמן מת משמעותי. שכר אפקטיבי של ${shekels(ctx.effectiveRate)} לשעה.`,
      score: base.score,
      base,
    };
  }

  // Feasibility/tight problem that a time-shift can fix.
  if (ctx.connectionConflict || base.score < 68) {
    const shift = findBetterTime(offer, classes, studios, profile);
    if (shift && shift.score >= base.score + 6 && !shift.context.connectionConflict) {
      return {
        verdict: "shift_time",
        headline: HEADLINE.shift_time,
        message: `אם השיעור יתחיל ב־${shift.time} במקום ${offer.start_time}, יהיה לך מספיק זמן להגיע מהשיעור הקודם והציון עולה ל־${shift.score}.`,
        score: base.score,
        suggestedTime: shift.time,
        base,
      };
    }
  }

  // Not worth it.
  const reasons: string[] = [];
  if (ctx.addedTravelMinutes > 40) {
    reasons.push(`השיעור מוסיף ${humanDuration(ctx.addedTravelMinutes)} נסיעה`);
  }
  if (ctx.overlapConflict) {
    reasons.push(`הוא מתנגש עם שיעור קיים`);
  }
  if (ctx.connectionConflict) {
    reasons.push(`הוא יוצר חיבור נסיעה בלתי אפשרי`);
  }
  const tail = `עבור ${shekels(offer.payment)} ומוריד את השכר האפקטיבי שלך ל־${shekels(ctx.effectiveRate)} לשעה.`;
  return {
    verdict: "not_worth",
    headline: HEADLINE.not_worth,
    message: `${reasons.length ? reasons.join(", ") + " " : ""}${tail}`,
    score: base.score,
    base,
  };
}

/** Try shifting the start time ±90 min in 15-min steps for a better score. */
function findBetterTime(
  offer: ClassOption,
  classes: ClassSession[],
  studios: Studio[],
  profile: UserProfile
): { time: string; score: number; context: ScoreResult["context"] } | null {
  const baseStart = toMinutes(offer.start_time);
  let best: { time: string; score: number; context: ScoreResult["context"] } | null = null;
  for (const delta of [15, 30, 45, 60, 90, -15, -30, -45]) {
    const start = baseStart + delta;
    if (start < 6 * 60 || start + offer.duration_minutes > 23 * 60) continue;
    const candidate = { ...offer, start_time: fromMinutes(start) };
    const res = scoreOption(candidate, classes, studios, profile);
    if (!best || res.score > best.score) {
      best = { time: fromMinutes(start), score: res.score, context: res.context };
    }
  }
  return best;
}

export type { ScoreResult };

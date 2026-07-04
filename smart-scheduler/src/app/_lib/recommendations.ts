import type { DayOfWeek, Recommendation, UserProfile } from "./types";
import type { WeekAnalysis, DayAnalysis } from "./engine";
import { DAY_NAMES, fromMinutes, humanDuration, shekels } from "./format";

// ---------------------------------------------------------------------------
// Proactive recommendation engine. It reads only *calculated* schedule facts
// (from WeekAnalysis) and phrases them in natural Hebrew. No value here is
// invented — every time / distance / amount comes from the engine.
// ---------------------------------------------------------------------------

const LOW_EFFECTIVE_RATE = 85; // ₪/h threshold for a "low efficiency" day
const OVERLOADED_TEACHING = 300; // 5h
const BIG_GAP = 120; // minutes

function stableId(parts: (string | number)[]): string {
  return parts.join(":");
}

export function generateRecommendations(week: WeekAnalysis): Recommendation[] {
  const recs: Recommendation[] = [];

  for (const day of week.days) {
    if (day.classes.length === 0) continue;
    collectConflicts(day, recs);
    collectGaps(day, recs);
  }

  collectLowEfficiencyDays(week, recs);
  collectOverloadedDays(week, recs);
  collectUnderutilizedDays(week, recs);
  collectBackToBack(week, recs);

  // Highest priority first; stable within a priority by day.
  return recs.sort((a, b) => a.priority - b.priority || (a.related_day ?? 9) - (b.related_day ?? 9));
}

function collectConflicts(day: DayAnalysis, recs: Recommendation[]) {
  for (const conn of day.connections) {
    if (conn.quality === "conflict") {
      const missing = Math.abs(conn.slackMinutes);
      recs.push({
        id: stableId(["conflict", day.day, conn.fromClassId, conn.toClassId]),
        type: "schedule_conflict",
        title: `חיבור בלתי אפשרי ב${DAY_NAMES[day.day]}`,
        message: `בין שני שיעורים סמוכים חסרות לך כ־${missing} דקות כדי להספיק להגיע. כדאי להזיז אחד מהם או לבחור תחבורה מהירה יותר.`,
        priority: 1,
        related_day: day.day,
        reason: `הפער בין השיעורים הוא ${humanDuration(conn.gapMinutes)}, זמן הנסיעה המשוער ${conn.travelMinutes} דקות, וכשמוסיפים זמן מעבר נוצר חוסר של ${missing} דקות.`,
      });
    } else if (conn.quality === "tight") {
      recs.push({
        id: stableId(["tight", day.day, conn.fromClassId, conn.toClassId]),
        type: "travel_problem",
        title: `חיבור צפוף ב${DAY_NAMES[day.day]}`,
        message: `נשארות לך רק ${Math.max(0, conn.slackMinutes)} דקות מרווח בין שני שיעורים. זה אפשרי, אבל בלי דקה מיותרת.`,
        priority: 2,
        related_day: day.day,
        reason: `פער של ${humanDuration(conn.gapMinutes)}, נסיעה של ${conn.travelMinutes} דקות, ומרווח ביטחון נותר של ${Math.max(0, conn.slackMinutes)} דקות בלבד. מומלץ לצאת ב־${fromMinutes(conn.departAt)}.`,
      });
    }
  }
}

function collectGaps(day: DayAnalysis, recs: Recommendation[]) {
  for (const conn of day.connections) {
    if (conn.quality === "conflict") continue;
    if (conn.gapMinutes >= BIG_GAP) {
      const windowStart = conn.departAt - conn.travelMinutes + 30; // after settling
      // available window between finishing prev (+buffer) and needing to leave
      const usable = conn.gapMinutes - conn.travelMinutes - 30;
      if (usable < 60) continue;
      const from = fromMinutes(day.connections.length ? conn.departAt - conn.gapMinutes + 30 : windowStart);
      const to = fromMinutes(conn.departAt);
      recs.push({
        id: stableId(["gap", day.day, conn.fromClassId, conn.toClassId]),
        type: "income_opportunity",
        title: `חלון פנוי ב${DAY_NAMES[day.day]}`,
        message: `יש לך חלון של ${humanDuration(conn.gapMinutes)} בין שני שיעורים קרובים. זה זמן מצוין להכניס שיעור נוסף באזור בין ${from} ל־${to}.`,
        priority: 3,
        related_day: day.day,
        reason: `השיעור הקודם מסתיים והבא מתחיל אחרי ${humanDuration(conn.gapMinutes)}. המרחק ביניהם הוא ${conn.travelMinutes} דקות בלבד, ולכן נשארות כ־${humanDuration(usable)} פנויות שאפשר לנצל לשיעור נוסף מבלי לפגוע בהגעה לשיעור הבא.`,
      });
    }
  }
}

function collectLowEfficiencyDays(week: WeekAnalysis, recs: Recommendation[]) {
  for (const day of week.days) {
    if (day.classes.length === 0) continue;
    const invested = day.teachingMinutes + day.travelMinutes + day.deadMinutes;
    const rate = invested > 0 ? (day.income / invested) * 60 : 0;
    if (rate > 0 && rate < LOW_EFFECTIVE_RATE && day.travelMinutes > day.teachingMinutes * 0.6) {
      recs.push({
        id: stableId(["loweff", day.day]),
        type: "low_efficiency",
        title: `שכר אפקטיבי נמוך ב${DAY_NAMES[day.day]}`,
        message: `ב${DAY_NAMES[day.day]} אתה מרוויח בפועל כ־${shekels(rate)} לשעה. הרבה מהזמן הולך לנסיעות. שווה לבדוק צימוד שיעורים או איחוד אזורים.`,
        priority: 3,
        related_day: day.day,
        reason: `הכנסה ${shekels(day.income)}, הוראה ${humanDuration(day.teachingMinutes)}, נסיעות ${humanDuration(day.travelMinutes)} וזמן מת ${humanDuration(day.deadMinutes)} — יחד ${shekels(rate)} לשעת עבודה אפקטיבית.`,
      });
    }
  }
}

function collectOverloadedDays(week: WeekAnalysis, recs: Recommendation[]) {
  for (const day of week.days) {
    if (day.teachingMinutes >= OVERLOADED_TEACHING || day.classes.length >= 5) {
      recs.push({
        id: stableId(["overload", day.day]),
        type: "geographic_optimization",
        title: `יום עמוס: ${DAY_NAMES[day.day]}`,
        message: `ב${DAY_NAMES[day.day]} יש לך ${day.classes.length} שיעורים ו־${humanDuration(day.teachingMinutes)} הוראה. כדאי לוודא שאתה לא מתיש את עצמך ושהמרווחים הגיוניים.`,
        priority: 4,
        related_day: day.day,
        reason: `${day.classes.length} שיעורים, ${humanDuration(day.teachingMinutes)} הוראה ו־${humanDuration(day.travelMinutes)} נסיעות באותו יום.`,
      });
    }
  }
}

function collectUnderutilizedDays(week: WeekAnalysis, recs: Recommendation[]) {
  const workdays: DayOfWeek[] = [0, 1, 2, 3, 4];
  const activeWorkdays = workdays.filter((d) => week.days[d].classes.length > 0);
  if (activeWorkdays.length === 0) return;
  for (const d of workdays) {
    const day = week.days[d];
    if (day.classes.length === 0) {
      recs.push({
        id: stableId(["under", d]),
        type: "new_class_opportunity",
        title: `${DAY_NAMES[d]} עדיין פנוי`,
        message: `${DAY_NAMES[d]} ריק לגמרי. אם תרצה להגדיל הכנסה, זה יום פוטנציאלי להוסיף בו שיעור או שניים באזור מוכר.`,
        priority: 5,
        related_day: d,
        reason: `אין שיעורים פעילים ב${DAY_NAMES[d]}, בעוד שאר ימי השבוע פעילים. יום פנוי הוא הזדמנות להכנסה נוספת ללא עומס על ימים קיימים.`,
      });
    }
  }
}

function collectBackToBack(week: WeekAnalysis, recs: Recommendation[]) {
  for (const day of week.days) {
    const efficient = day.connections.filter((c) => c.quality === "efficient" && c.gapMinutes < 90);
    if (efficient.length >= 2) {
      recs.push({
        id: stableId(["b2b", day.day]),
        type: "geographic_optimization",
        title: `רצף חכם ב${DAY_NAMES[day.day]}`,
        message: `ב${DAY_NAMES[day.day]} יש לך רצף יעיל של שיעורים צמודים באותו אזור. זה בדיוק המבנה שמשפר את השכר האפקטיבי — כדאי לשמר אותו.`,
        priority: 5,
        related_day: day.day,
        reason: `${efficient.length} חיבורים יעילים באותו יום עם נסיעות קצרות בין השיעורים — צימוד גאוגרפי טוב.`,
      });
    }
  }
}

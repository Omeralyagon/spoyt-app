import type { ClassSession, Studio, UserProfile } from "./types";
import { TRANSPORT_LABEL } from "./format";

// Generates a standard .ics event for a class. When the recurring flag is set
// we attach a weekly RRULE. Works with any phone calendar (Google/Apple/Outlook).

const ICS_DAY: Record<number, string> = {
  0: "SU",
  1: "MO",
  2: "TU",
  3: "WE",
  4: "TH",
  5: "FR",
  6: "SA",
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Next date (yyyy,mm,dd) matching the given weekday, from a reference date. */
function nextDateForDay(dayOfWeek: number, ref: Date): { y: number; m: number; d: number } {
  const diff = (dayOfWeek - ref.getDay() + 7) % 7;
  const target = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + diff);
  return { y: target.getFullYear(), m: target.getMonth() + 1, d: target.getDate() };
}

function dtStamp(y: number, m: number, d: number, time: string): string {
  const [hh, mm] = time.split(":");
  return `${y}${pad(m)}${pad(d)}T${pad(Number(hh))}${pad(Number(mm))}00`;
}

export function buildICS(
  session: ClassSession,
  studio: Studio | null,
  profile: UserProfile,
  now: Date
): string {
  const { y, m, d } = nextDateForDay(session.day_of_week, now);
  const start = dtStamp(y, m, d, session.start_time);
  const end = dtStamp(y, m, d, session.end_time);
  const uid = `spoyt-${session.id}@scheduler`;

  const notesLines = [
    studio ? `סטודיו: ${studio.name}` : "",
    session.class_type ? `סוג: ${session.class_type}` : "",
    `הגעה: ${TRANSPORT_LABEL[session.transportation_mode]}`,
    profile.include_payment_in_calendar ? `תשלום: ₪${session.payment}` : "",
    session.notes ? session.notes : "",
  ].filter(Boolean);

  const escape = (s: string) => s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Spoyt Scheduler//HE//",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTART;TZID=Asia/Jerusalem:${start}`,
    `DTEND;TZID=Asia/Jerusalem:${end}`,
    session.is_recurring ? `RRULE:FREQ=WEEKLY;BYDAY=${ICS_DAY[session.day_of_week]}` : "",
    `SUMMARY:${escape(session.class_name || "שיעור")}`,
    studio ? `LOCATION:${escape(studio.address)}` : "",
    `DESCRIPTION:${escape(notesLines.join("\n"))}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
}

export function downloadICS(filename: string, content: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

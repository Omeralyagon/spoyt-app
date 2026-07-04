import type { SchedulerState, Studio, ClassSession, UserProfile } from "./types";

// Realistic Tel-Aviv demo data so the full experience works immediately.

const studios: Studio[] = [
  { id: "st_flow", name: "Flow Studio", address: "דיזנגוף 120, תל אביב", latitude: 32.0809, longitude: 34.774, parking_cost: 0, notes: "כניסה מהחצר האחורית" },
  { id: "st_move", name: "Move Studio", address: "פלורנטין 30, תל אביב", latitude: 32.0555, longitude: 34.769, parking_cost: 0 },
  { id: "st_balance", name: "Balance", address: "אבן גבירול 190, תל אביב", latitude: 32.0995, longitude: 34.782, parking_cost: 22, notes: "חניון בתשלום ברחוב" },
  { id: "st_urban", name: "Urban Yoga", address: "יפת 40, יפו", latitude: 32.052, longitude: 34.752, parking_cost: 0 },
  { id: "st_core", name: "Core Studio", address: "ביאליק 25, רמת גן", latitude: 32.084, longitude: 34.814, parking_cost: 18 },
];

const profile: UserProfile = {
  full_name: "נועה",
  home_address: "באזל 12, תל אביב",
  home_lat: 32.0895,
  home_lng: 34.776,
  default_transportation_mode: "bicycle",
  optimization_priority: "smart_balance",
  travel_buffer_minutes: 10,
  transition_time_minutes: 10,
  calendar_sync_enabled: false,
  include_payment_in_calendar: false,
};

function session(
  id: string,
  studio_id: string,
  class_name: string,
  class_type: string,
  day_of_week: ClassSession["day_of_week"],
  start_time: string,
  end_time: string,
  payment: number,
  transportation_mode: ClassSession["transportation_mode"]
): ClassSession {
  const [sh, sm] = start_time.split(":").map(Number);
  const [eh, em] = end_time.split(":").map(Number);
  return {
    id,
    studio_id,
    class_name,
    class_type,
    day_of_week,
    start_time,
    end_time,
    duration_minutes: eh * 60 + em - (sh * 60 + sm),
    payment,
    transportation_mode,
    is_recurring: true,
    status: "active",
  };
}

const classes: ClassSession[] = [
  // ראשון
  session("c1", "st_flow", "ויניאסה בוקר", "ויניאסה", 0, "08:00", "09:00", 180, "bicycle"),
  session("c2", "st_move", "פילאטיס מזרן", "פילאטיס", 0, "10:00", "11:00", 160, "bicycle"),
  // שני — חיבור צפוף בין ת״א לרמת גן
  session("c3", "st_balance", "יוגה ערב", "האטה", 1, "17:00", "18:00", 190, "car"),
  session("c4", "st_core", "פילאטיס מכשירים", "פילאטיס מכשירים", 1, "18:30", "19:30", 210, "car"),
  // שלישי — חלון של 3 שעות בין שני שיעורים קרובים
  session("c5", "st_flow", "ויניאסה", "ויניאסה", 2, "11:00", "12:00", 180, "bicycle"),
  session("c6", "st_move", "פילאטיס", "פילאטיס", 2, "15:00", "16:00", 160, "bicycle"),
  // רביעי
  session("c7", "st_balance", "פאוור יוגה", "פאוור", 3, "08:00", "09:15", 200, "car"),
  session("c8", "st_urban", "האטה ערב", "האטה", 3, "18:00", "19:00", 150, "public_transport"),
  // חמישי — רצף יעיל של שלושה שיעורים
  session("c9", "st_flow", "ויניאסה", "ויניאסה", 4, "09:00", "10:00", 180, "bicycle"),
  session("c10", "st_move", "פילאטיס", "פילאטיס", 4, "10:45", "11:45", 160, "bicycle"),
  session("c11", "st_urban", "סטרצ׳ינג", "מתיחות", 4, "12:30", "13:30", 150, "bicycle"),
];

export function demoState(): SchedulerState {
  return {
    profile,
    studios,
    classes,
    offers: [],
    decisions: [],
    dismissedRecommendations: [],
  };
}

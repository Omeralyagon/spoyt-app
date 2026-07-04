// Domain model for the freelance-instructor scheduler.
// Mirrors the requested Base44 entities, adapted to a self-contained TS app.

export type TransportMode = "bicycle" | "car" | "walking" | "public_transport";

export type OptimizationPriority =
  | "maximum_income"
  | "minimum_travel"
  | "smart_balance";

export type SessionStatus = "active" | "cancelled" | "completed";
export type OfferStatus = "pending" | "accepted" | "rejected" | "negotiating";

export type RecommendationType =
  | "schedule_gap"
  | "travel_problem"
  | "income_opportunity"
  | "class_swap"
  | "schedule_conflict"
  | "low_efficiency"
  | "geographic_optimization"
  | "new_class_opportunity";

/** 0 = Sunday … 6 = Saturday (the Israeli week starts on Sunday). */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface UserProfile {
  full_name: string;
  home_address: string;
  home_lat: number;
  home_lng: number;
  default_transportation_mode: TransportMode;
  optimization_priority: OptimizationPriority;
  travel_buffer_minutes: number;
  transition_time_minutes: number;
  calendar_sync_enabled: boolean;
  include_payment_in_calendar: boolean;
}

export interface Studio {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  parking_cost: number;
  notes?: string;
}

export interface ClassSession {
  id: string;
  studio_id: string;
  class_name: string;
  class_type: string;
  day_of_week: DayOfWeek;
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
  duration_minutes: number;
  payment: number;
  transportation_mode: TransportMode;
  is_recurring: boolean;
  notes?: string;
  status: SessionStatus;
}

/** A prospective class the user is evaluating (offer analyzer / decision options). */
export interface ClassOption {
  studio_id: string | null;
  address: string;
  latitude: number;
  longitude: number;
  day_of_week: DayOfWeek;
  start_time: string;
  duration_minutes: number;
  payment: number;
  transportation_mode: TransportMode;
}

export interface ClassOffer extends ClassOption {
  id: string;
  status: OfferStatus;
  analysis_score: number;
  recommendation: string;
  recommendation_reason: string;
  created_date: string;
}

export interface DecisionComparison {
  id: string;
  title: string;
  option_a_data: ClassOption;
  option_b_data: ClassOption;
  option_a_score: number;
  option_b_score: number;
  recommended_option: "a" | "b";
  recommendation_reason: string;
  created_date: string;
}

export interface Recommendation {
  id: string;
  type: RecommendationType;
  title: string;
  message: string;
  priority: number; // 1 (highest) … 5
  related_class_id?: string;
  related_day?: DayOfWeek;
  reason: string; // the "why" — calculated explanation
}

export interface SchedulerState {
  profile: UserProfile;
  studios: Studio[];
  classes: ClassSession[];
  offers: ClassOffer[];
  decisions: DecisionComparison[];
  dismissedRecommendations: string[];
}

export const CATEGORIES = [
  "Yoga",
  "Vinyasa Yoga",
  "Power Yoga",
  "Pilates",
  "Pilates Reformer",
  "Barre",
  "Functional Training",
  "HIIT",
  "Strength",
  "Mobility",
  "Stretching",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const DIFFICULTIES = [
  "beginner",
  "intermediate",
  "advanced",
  "all-levels",
] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];

export const VISIBILITIES = ["public", "private"] as const;
export type Visibility = (typeof VISIBILITIES)[number];

export const CERT_STATUSES = ["pending", "approved", "rejected"] as const;
export type CertStatus = (typeof CERT_STATUSES)[number];

export const STORAGE_BUCKETS = {
  avatars: "avatars",
  covers: "covers",
  certifications: "certifications",
} as const;

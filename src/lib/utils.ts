import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Extract a YouTube video id from common URL shapes. */
export function youtubeId(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  );
  return m ? m[1] : null;
}

/** Relevance score used to rank the feed: engagement + recency decay. */
export function flowScore(opts: {
  likes: number;
  steals: number;
  createdAt: string | Date;
}): number {
  const ageHours =
    (Date.now() - new Date(opts.createdAt).getTime()) / 36e5;
  const gravity = 1.6;
  const engagement = opts.likes + opts.steals * 2.5;
  return (engagement + 1) / Math.pow(ageHours + 2, gravity / 4);
}

export function initials(name?: string | null): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

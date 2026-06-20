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

/** Compact count formatting: 950 → "950", 5200 → "5.2K", 1_800_000 → "1.8M". */
export function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) {
    const v = n / 1000;
    return `${v.toFixed(v >= 100 ? 0 : 1).replace(/\.0$/, "")}K`;
  }
  const v = n / 1_000_000;
  return `${v.toFixed(1).replace(/\.0$/, "")}M`;
}

/** Build an embeddable player URL for a Spotify or Apple Music link. */
export function musicEmbed(
  url?: string | null,
): { src: string; tall: boolean } | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    if (u.hostname.includes("spotify.com")) {
      const m = u.pathname.match(
        /\/(track|album|playlist|artist|episode|show)\/([A-Za-z0-9]+)/,
      );
      if (m)
        return {
          src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`,
          tall: m[1] === "playlist" || m[1] === "album" || m[1] === "show",
        };
    }
    if (u.hostname.includes("music.apple.com")) {
      return {
        src: `https://embed.music.apple.com${u.pathname}${u.search}`,
        tall: true,
      };
    }
  } catch {
    /* not a valid URL */
  }
  return null;
}

/** True if the URL points to a video file (by extension). */
export function isVideo(url?: string | null): boolean {
  if (!url) return false;
  return /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(url);
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

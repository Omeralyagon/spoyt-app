import { cn } from "@/lib/utils";

/**
 * Steal My Flow mascot — the green thief.
 * Vector so it renders crisp at any size with a transparent background.
 * Swap for an uploaded PNG at /public/mascot.png if desired.
 */
export function Mascot({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("h-8 w-8", className)}
      fill="none"
      aria-hidden
    >
      {/* head */}
      <path
        d="M32 6c11 0 18 8 18 22 0 13-8 28-18 28S14 41 14 28C14 14 21 6 32 6Z"
        fill="#111418"
      />
      {/* beanie crown */}
      <path
        d="M32 5c9.5 0 16 6.4 17.4 16.5C46 23 39.6 24 32 24s-14-1-17.4-2.5C16 11.4 22.5 5 32 5Z"
        fill="#1b1f26"
      />
      {/* beanie brim */}
      <rect x="13.5" y="20.5" width="37" height="7.5" rx="3.4" fill="#23272f" />
      {/* brim ribs */}
      {[19, 25, 31, 37, 43].map((x) => (
        <line
          key={x}
          x1={x}
          y1="21.5"
          x2={x}
          y2="27"
          stroke="#11141a"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      ))}
      {/* sunglasses glow */}
      <rect
        x="15"
        y="29"
        width="34"
        height="14"
        rx="7"
        fill="#9AE66E"
        opacity="0.9"
      />
      {/* lenses */}
      <rect x="17.5" y="31" width="12.5" height="9.5" rx="4.5" fill="#0c0e12" />
      <rect x="34" y="31" width="12.5" height="9.5" rx="4.5" fill="#0c0e12" />
      {/* bridge */}
      <rect x="30" y="33.5" width="4" height="3" rx="1.5" fill="#9AE66E" />
      {/* lens shine */}
      <line
        x1="20.5"
        y1="38.5"
        x2="26"
        y2="33"
        stroke="#3a3f49"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="37"
        y1="38.5"
        x2="42.5"
        y2="33"
        stroke="#3a3f49"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

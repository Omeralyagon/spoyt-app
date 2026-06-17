import { cn } from "@/lib/utils";

/**
 * Steal My Flow mascot — the green thief.
 * Glossy vector rendition (transparent background) that mirrors the 3D logo.
 * To use the exact uploaded artwork instead, drop it at /public/mascot.png
 * and swap this component for <img src="/mascot.png" />.
 */
export function Mascot({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("h-8 w-8", className)}
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="smf-head" x1="32" y1="6" x2="32" y2="58">
          <stop offset="0" stopColor="#23272f" />
          <stop offset="0.55" stopColor="#13161b" />
          <stop offset="1" stopColor="#070809" />
        </linearGradient>
        <linearGradient id="smf-beanie" x1="32" y1="4" x2="32" y2="24">
          <stop offset="0" stopColor="#2b2f38" />
          <stop offset="1" stopColor="#15181e" />
        </linearGradient>
        <linearGradient id="smf-lens" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2e36" />
          <stop offset="1" stopColor="#0a0b0f" />
        </linearGradient>
        <filter id="smf-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.1" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* head */}
      <path
        d="M32 6c11 0 18 8 18 22 0 13-8 28-18 28S14 41 14 28C14 14 21 6 32 6Z"
        fill="url(#smf-head)"
      />
      {/* top sheen */}
      <ellipse cx="27" cy="14" rx="9" ry="5" fill="#ffffff" opacity="0.06" />

      {/* beanie crown */}
      <path
        d="M32 5c9.5 0 16 6.4 17.4 16.5C46 23 39.6 24 32 24s-14-1-17.4-2.5C16 11.4 22.5 5 32 5Z"
        fill="url(#smf-beanie)"
      />
      {/* beanie brim */}
      <rect x="13.5" y="20.5" width="37" height="7.8" rx="3.6" fill="#2c313a" />
      <rect
        x="13.5"
        y="20.5"
        width="37"
        height="3"
        rx="1.5"
        fill="#ffffff"
        opacity="0.05"
      />
      {[18.5, 24.5, 30.5, 36.5, 42.5].map((x) => (
        <line
          key={x}
          x1={x}
          y1="21.3"
          x2={x}
          y2="27.4"
          stroke="#0f1218"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      ))}

      {/* neon sunglasses frame (glowing) */}
      <g filter="url(#smf-glow)">
        <rect x="14.5" y="28.5" width="35" height="15" rx="7.5" fill="#A8F24A" />
      </g>
      {/* lenses */}
      <rect x="17.3" y="30.6" width="13" height="10.2" rx="4.8" fill="url(#smf-lens)" />
      <rect x="33.7" y="30.6" width="13" height="10.2" rx="4.8" fill="url(#smf-lens)" />
      {/* bridge */}
      <rect x="29.8" y="33" width="4.4" height="3.2" rx="1.6" fill="#A8F24A" />
      {/* diagonal lens shine */}
      <line x1="20" y1="39" x2="26" y2="32.5" stroke="#52585f" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="36.5" y1="39" x2="42.5" y2="32.5" stroke="#52585f" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

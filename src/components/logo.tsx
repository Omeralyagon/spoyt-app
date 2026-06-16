import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("group flex items-center gap-2.5", className)}
      aria-label="Steal My Flow"
    >
      <span className="relative inline-flex h-7 w-7 items-center justify-center">
        <svg viewBox="0 0 28 28" className="h-7 w-7" fill="none" aria-hidden>
          <path
            d="M4 19c4-9 8 9 12 0s8 9 8 0"
            stroke="hsl(var(--foreground))"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M4 13c4-9 8 9 12 0s8 9 8 0"
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="font-display text-lg font-medium tracking-tight">
        Steal&nbsp;My&nbsp;Flow
      </span>
    </Link>
  );
}

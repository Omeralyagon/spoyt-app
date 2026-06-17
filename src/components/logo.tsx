import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("group flex items-center gap-2", className)}
      aria-label="Steal My Flow"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mascot.png"
        alt=""
        className="h-8 w-8 object-contain transition-transform group-hover:-rotate-6"
        draggable={false}
      />
      <span className="font-display text-xl tracking-wide">
        STEAL MY FLOW
      </span>
    </Link>
  );
}

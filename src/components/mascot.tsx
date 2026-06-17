import { cn } from "@/lib/utils";

/** Steal My Flow mascot — the green thief (transparent PNG in /public). */
export function Mascot({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/mascot.png"
      alt="Steal My Flow"
      className={cn("h-8 w-8 object-contain", className)}
      draggable={false}
    />
  );
}

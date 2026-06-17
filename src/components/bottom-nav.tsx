"use client";

import { motion } from "framer-motion";
import { Home, Compass, Library, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Mascot } from "@/components/mascot";
import { cn } from "@/lib/utils";

export function BottomNav({
  signedIn,
  profileId,
}: {
  signedIn: boolean;
  profileId: string | null;
}) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const items = [
    { href: "/feed", label: t("home"), icon: Home },
    { href: "/discover", label: t("discover"), icon: Compass },
    { href: "/generate", label: t("create"), icon: Home, center: true },
    {
      href: signedIn ? "/library" : "/login",
      label: t("library"),
      icon: Library,
    },
    {
      href: signedIn && profileId ? `/profile/${profileId}` : "/login",
      label: t("profile"),
      icon: User,
    },
  ];

  const isActive = (href: string) =>
    href === "/feed"
      ? pathname === "/feed"
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex justify-center pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
      <div className="flex items-center gap-1 rounded-full border border-border/70 bg-card/80 px-2 py-2 shadow-2xl backdrop-blur-xl">
        {items.map((item) => {
          const active = isActive(item.href);
          if (item.center) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className="mx-1"
              >
                <motion.span
                  animate={{ y: [0, -3, 0] }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.82, rotate: -6 }}
                  className="relative -mt-8 flex items-center justify-center"
                >
                  {/* green glow behind the mascot */}
                  <span className="absolute h-11 w-11 rounded-full bg-primary/50 blur-xl" />
                  <Mascot className="relative h-[68px] w-[68px] drop-shadow-[0_0_10px_rgba(154,230,110,0.55)]" />
                </motion.span>
              </Link>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className="relative"
            >
              <motion.span
                whileTap={{ scale: 0.85 }}
                className={cn(
                  "flex h-11 w-14 flex-col items-center justify-center gap-0.5 rounded-full text-[10px] font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon
                  className={cn("h-5 w-5", active && "fill-primary/15")}
                />
                <span className="leading-none">{item.label}</span>
              </motion.span>
              {active && (
                <motion.span
                  layoutId="bottomnav-active"
                  className="absolute inset-x-3 -top-0.5 h-1 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

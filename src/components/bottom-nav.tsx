"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Home, Compass, Library, User, Sparkles, PenLine } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Mascot } from "@/components/mascot";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
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
  const [createOpen, setCreateOpen] = useState(false);

  // Hide app navigation on public/auth screens.
  const PUBLIC = ["/login", "/register", "/forgot-password", "/reset-password"];
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return null;
  }

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
              <button
                key="create"
                type="button"
                aria-label={item.label}
                className="mx-1"
                onClick={() => setCreateOpen(true)}
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
                  className="relative -mt-11 flex items-center justify-center"
                >
                  {/* green glow behind the mascot */}
                  <span className="absolute h-14 w-14 rounded-full bg-primary/50 blur-xl" />
                  <Mascot className="relative h-[92px] w-[92px] drop-shadow-[0_0_12px_rgba(154,230,110,0.6)]" />
                </motion.span>
              </button>
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

      {/* Create choice: AI vs manual */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogTitle>{t("createChoice")}</DialogTitle>
          <div className="mt-5 grid gap-3">
            <DialogClose asChild>
              <Link
                href="/generate"
                className="flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Sparkles className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-semibold">{t("createWithAI")}</span>
                  <span className="block text-sm text-muted-foreground">
                    {t("createWithAIDesc")}
                  </span>
                </span>
              </Link>
            </DialogClose>
            <DialogClose asChild>
              <Link
                href="/create"
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-accent"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-foreground">
                  <PenLine className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-semibold">
                    {t("writeYourself")}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {t("writeYourselfDesc")}
                  </span>
                </span>
              </Link>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </nav>
  );
}

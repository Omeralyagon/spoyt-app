"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Heart, Zap, Clock, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toggleLike, toggleSteal } from "@/lib/actions";
import { cn, initials } from "@/lib/utils";
import type { FlowCard as FlowCardData } from "@/lib/queries";

export function FlowCard({
  flow,
  liked = false,
  stolen = false,
}: {
  flow: FlowCardData;
  liked?: boolean;
  stolen?: boolean;
}) {
  const td = useTranslations("difficulty");
  const tc = useTranslations("common");
  const tAuth = useTranslations("auth");
  const router = useRouter();
  const [isPending, start] = useTransition();

  const [likeState, setLikeState] = useState({ on: liked, n: flow.like_count });
  const [stealState, setStealState] = useState({
    on: stolen,
    n: flow.steal_count,
  });
  const [stealBurst, setStealBurst] = useState(0);

  function engage(kind: "like" | "steal", e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const action = kind === "like" ? toggleLike : toggleSteal;
    const setter = kind === "like" ? setLikeState : setStealState;
    const cur = kind === "like" ? likeState : stealState;
    setter({ on: !cur.on, n: cur.n + (cur.on ? -1 : 1) });
    if (kind === "steal" && !cur.on) setStealBurst((b) => b + 1);
    start(async () => {
      const res = await action(flow.id);
      if (!res.ok) {
        setter(cur);
        if (res.error === "auth") {
          toast.error(tAuth("loginRequired"));
          router.push("/login");
        }
      }
    });
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="snap-card"
    >
      <Link
        href={`/flow/${flow.id}`}
        className="group relative block aspect-[4/5] overflow-hidden rounded-3xl border border-border/60 bg-card"
      >
        {/* cover */}
        {flow.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={flow.cover_image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-card to-secondary/20" />
        )}
        {/* legibility gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/30" />

        {/* category chip */}
        <span className="absolute start-4 top-4 rounded-full bg-black/45 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
          {flow.category}
        </span>
        <span className="absolute end-4 top-4 inline-flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
          <Clock className="h-3.5 w-3.5" />
          {flow.duration_minutes}
          {tc("minutes")}
        </span>

        {/* action rail */}
        <div className="absolute bottom-28 end-3 z-10 flex flex-col items-center gap-4">
          <ActionButton
            onClick={(e) => engage("like", e)}
            active={likeState.on}
            count={likeState.n}
            disabled={isPending}
          >
            <Heart
              className={cn("h-6 w-6", likeState.on && "fill-current")}
            />
          </ActionButton>

          <div className="relative">
            <ActionButton
              onClick={(e) => engage("steal", e)}
              active={stealState.on}
              count={stealState.n}
              variant="primary"
              disabled={isPending}
            >
              <Zap className={cn("h-6 w-6", stealState.on && "fill-current")} />
            </ActionButton>
            <AnimatePresence>
              {stealBurst > 0 && (
                <motion.span
                  key={stealBurst}
                  initial={{ scale: 0.7, opacity: 0.7 }}
                  animate={{ scale: 2.3, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="pointer-events-none absolute left-1/2 top-5 h-12 w-12 -translate-x-1/2 rounded-full bg-primary/40"
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* content */}
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h3 className="line-clamp-2 font-display text-2xl leading-none text-white">
            {flow.title}
          </h3>
          <div className="mt-2 flex items-center gap-2 text-xs text-white/75">
            <span>{td(flow.difficulty)}</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Avatar className="h-7 w-7 ring-1 ring-white/30">
              {flow.creator?.avatar_url && (
                <AvatarImage src={flow.creator.avatar_url} alt="" />
              )}
              <AvatarFallback className="bg-white/15 text-[10px] text-white">
                {initials(flow.creator?.full_name)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm font-medium text-white/90">
              {flow.creator?.full_name ?? "—"}
            </span>
            {flow.creator?.verified && (
              <BadgeCheck className="h-4 w-4 text-primary" />
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function ActionButton({
  children,
  onClick,
  active,
  count,
  variant = "ghost",
  disabled,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  active: boolean;
  count: number;
  variant?: "ghost" | "primary";
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <motion.button
        onClick={onClick}
        disabled={disabled}
        whileTap={{ scale: 0.8 }}
        animate={active ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ duration: 0.35 }}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-md transition-colors",
          variant === "primary" && active
            ? "bg-primary text-primary-foreground glow-primary"
            : variant === "primary"
              ? "bg-primary/90 text-primary-foreground"
              : active
                ? "bg-white/20 text-primary"
                : "bg-black/40 text-white hover:bg-black/55",
        )}
      >
        {children}
      </motion.button>
      <span className="text-xs font-semibold text-white drop-shadow">
        {count}
      </span>
    </div>
  );
}

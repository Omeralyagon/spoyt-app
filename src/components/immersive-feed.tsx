"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  Heart,
  Share2,
  UserPlus,
  UserCheck,
  Clock,
  BadgeCheck,
  Eye,
  Music,
} from "lucide-react";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mascot } from "@/components/mascot";
import { triggerStealBurst } from "@/components/steal-overlay";
import { toggleLike, toggleSteal, toggleFollow } from "@/lib/actions";
import { cn, initials, isVideo } from "@/lib/utils";
import type { FlowCard } from "@/lib/queries";

export interface FeedItem {
  flow: FlowCard;
  liked: boolean;
  stolen: boolean;
  following: boolean;
}

export function ImmersiveFeed({ items }: { items: FeedItem[] }) {
  return (
    <div className="snap-feed no-scrollbar h-[calc(100dvh-4rem)] overflow-y-auto">
      {items.map((item) => (
        <FeedScreen key={item.flow.id} item={item} />
      ))}
    </div>
  );
}

function FeedScreen({ item }: { item: FeedItem }) {
  const { flow } = item;
  const td = useTranslations("difficulty");
  const tc = useTranslations("common");
  const tf = useTranslations("flow");
  const tAuth = useTranslations("auth");
  const router = useRouter();
  const [, start] = useTransition();

  const [like, setLike] = useState({ on: item.liked, n: flow.like_count });
  const [steal, setSteal] = useState({ on: item.stolen, n: flow.steal_count });
  const [following, setFollowing] = useState(item.following);
  const [burst, setBurst] = useState(0);

  function authGuard(error?: string) {
    if (error === "auth") {
      toast.error(tAuth("loginRequired"));
      router.push("/login");
      return true;
    }
    return false;
  }

  function onLike() {
    const cur = like;
    setLike({ on: !cur.on, n: cur.n + (cur.on ? -1 : 1) });
    start(async () => {
      const r = await toggleLike(flow.id);
      if (!r.ok) {
        setLike(cur);
        authGuard(r.error);
      }
    });
  }
  function onSteal() {
    const cur = steal;
    setSteal({ on: !cur.on, n: cur.n + (cur.on ? -1 : 1) });
    if (!cur.on) {
      setBurst((b) => b + 1);
      triggerStealBurst();
    }
    start(async () => {
      const r = await toggleSteal(flow.id);
      if (!r.ok) {
        setSteal(cur);
        authGuard(r.error);
      }
    });
  }
  function onFollow() {
    if (!flow.creator) return;
    const prev = following;
    setFollowing(!prev);
    start(async () => {
      const r = await toggleFollow(flow.creator!.id);
      if (!r.ok) {
        setFollowing(prev);
        authGuard(r.error);
      }
    });
  }
  async function onShare() {
    await navigator.clipboard.writeText(
      `${window.location.origin}/flow/${flow.id}`,
    );
    toast.success(tf("linkCopied"));
  }

  return (
    <section className="snap-card flex h-[calc(100dvh-4rem)] items-center justify-center px-3 py-3">
      <div className="relative mx-auto h-full max-h-[760px] w-full max-w-md overflow-hidden rounded-[2rem] border border-border/60 bg-card">
        {/* cover */}
        {flow.cover_image && isVideo(flow.cover_image) ? (
          <video
            src={flow.cover_image}
            className="absolute inset-0 h-full w-full object-cover"
            muted
            loop
            autoPlay
            playsInline
          />
        ) : flow.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={flow.cover_image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-card to-secondary/25" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/40" />

        {/* tapping anywhere on the cover opens the lesson (action rail & bottom
            content sit above this at z-20, so their buttons still work) */}
        <Link
          href={`/flow/${flow.id}`}
          aria-label={flow.title}
          className="absolute inset-0 z-10"
        />


        {/* top chips */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <span className="rounded-full bg-black/45 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
            {flow.category}
          </span>
          <span className="inline-flex items-center gap-2">
            {flow.music_url && (
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/90 text-primary-foreground backdrop-blur-md">
                <Music className="h-3.5 w-3.5" />
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
              <Clock className="h-3.5 w-3.5" />
              {flow.duration_minutes} {tc("minutes")}
            </span>
          </span>
        </div>

        {/* right action rail */}
        <div className="absolute bottom-32 end-3 z-20 flex flex-col items-center gap-5">
          <Rail label={like.n} onClick={onLike} active={like.on}>
            <Heart className={cn("h-7 w-7", like.on && "fill-current")} />
          </Rail>
          <div className="relative">
            <Rail
              label={steal.n}
              onClick={onSteal}
              active={steal.on}
              primary
            >
              <Mascot className="h-7 w-7" />
            </Rail>
            <AnimatePresence>
              {burst > 0 && (
                <motion.span
                  key={burst}
                  initial={{ scale: 0.7, opacity: 0.7 }}
                  animate={{ scale: 2.4, opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="pointer-events-none absolute left-1/2 top-6 h-14 w-14 -translate-x-1/2 rounded-full bg-primary/40"
                />
              )}
            </AnimatePresence>
          </div>
          {flow.creator && (
            <button
              onClick={onFollow}
              className="flex flex-col items-center gap-1"
              aria-label={tf("follow")}
            >
              <motion.span
                whileTap={{ scale: 0.85 }}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-md",
                  following ? "bg-white/20 text-primary" : "bg-black/40 text-white",
                )}
              >
                {following ? (
                  <UserCheck className="h-6 w-6" />
                ) : (
                  <UserPlus className="h-6 w-6" />
                )}
              </motion.span>
            </button>
          )}
          <Rail onClick={onShare}>
            <Share2 className="h-6 w-6" />
          </Rail>
        </div>

        {/* bottom content */}
        <div className="absolute inset-x-0 bottom-0 z-20 p-5 pe-20">
          <Link href={`/flow/${flow.id}`}>
            <h2 className="line-clamp-3 font-display text-3xl leading-none text-white">
              {flow.title}
            </h2>
          </Link>
          <p className="mt-2 text-sm text-white/70">{td(flow.difficulty)}</p>
          {flow.creator && (
            <Link
              href={`/profile/${flow.creator.id}`}
              className="mt-3 flex items-center gap-2"
            >
              <Avatar className="h-8 w-8 ring-1 ring-white/30">
                {flow.creator.avatar_url && (
                  <AvatarImage src={flow.creator.avatar_url} alt="" />
                )}
                <AvatarFallback className="bg-white/15 text-[10px] text-white">
                  {initials(flow.creator.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-semibold text-white">
                {flow.creator.full_name ?? "—"}
              </span>
              {flow.creator.verified && (
                <BadgeCheck className="h-4 w-4 text-primary" />
              )}
            </Link>
          )}
          <Link
            href={`/flow/${flow.id}`}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
          >
            <Eye className="h-4 w-4" />
            {tf("structure")}
          </Link>
        </div>
      </div>
    </section>
  );
}

function Rail({
  children,
  onClick,
  active,
  primary,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  primary?: boolean;
  label?: number;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.8 }}
        animate={active ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ duration: 0.35 }}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-md transition-colors",
          primary && active
            ? "bg-primary text-primary-foreground glow-primary"
            : primary
              ? "bg-primary/90 text-primary-foreground"
              : active
                ? "bg-white/20 text-primary"
                : "bg-black/40 text-white hover:bg-black/55",
        )}
      >
        {children}
      </motion.button>
      {typeof label === "number" && (
        <span className="text-xs font-semibold text-white drop-shadow">
          {label}
        </span>
      )}
    </div>
  );
}

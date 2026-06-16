"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Heart, Bookmark, Clock, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
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
  const t = useTranslations("flow");
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

  function engage(
    kind: "like" | "steal",
    e: React.MouseEvent,
  ) {
    e.preventDefault();
    e.stopPropagation();
    const action = kind === "like" ? toggleLike : toggleSteal;
    const setter = kind === "like" ? setLikeState : setStealState;
    const cur = kind === "like" ? likeState : stealState;
    // optimistic
    setter({ on: !cur.on, n: cur.n + (cur.on ? -1 : 1) });
    start(async () => {
      const res = await action(flow.id);
      if (!res.ok) {
        setter(cur); // rollback
        if (res.error === "auth") {
          toast.error(tAuth("loginRequired"));
          router.push("/login");
        }
      }
    });
  }

  return (
    <Link
      href={`/flow/${flow.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* cover */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {flow.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={flow.cover_image}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-accent to-secondary">
            <span className="font-serif text-2xl text-foreground/30">
              {flow.category}
            </span>
          </div>
        )}
        <Badge className="absolute start-3 top-3 bg-background/85 text-foreground backdrop-blur">
          {flow.category}
        </Badge>
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-serif text-lg leading-snug">
          {flow.title}
        </h3>

        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {flow.duration_minutes} {tc("minutes")}
          </span>
          <span>·</span>
          <span>{td(flow.difficulty)}</span>
        </div>

        {/* creator */}
        <div className="mt-3 flex items-center gap-2">
          <Avatar className="h-6 w-6">
            {flow.creator?.avatar_url && (
              <AvatarImage src={flow.creator.avatar_url} alt="" />
            )}
            <AvatarFallback className="text-[10px]">
              {initials(flow.creator?.full_name)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-xs text-muted-foreground">
            {flow.creator?.full_name ?? "—"}
          </span>
          {flow.creator?.verified && (
            <BadgeCheck className="h-3.5 w-3.5 text-primary" />
          )}
        </div>

        {/* actions */}
        <div className="mt-4 flex items-center gap-1 border-t border-border/70 pt-3">
          <button
            onClick={(e) => engage("like", e)}
            disabled={isPending}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors hover:bg-accent",
              likeState.on ? "text-primary" : "text-muted-foreground",
            )}
            aria-label={t("like")}
          >
            <Heart
              className={cn("h-4 w-4", likeState.on && "fill-current")}
            />
            {likeState.n}
          </button>
          <button
            onClick={(e) => engage("steal", e)}
            disabled={isPending}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors hover:bg-accent",
              stealState.on ? "text-primary" : "text-muted-foreground",
            )}
            aria-label={t("steal")}
          >
            <Bookmark
              className={cn("h-4 w-4", stealState.on && "fill-current")}
            />
            {stealState.n}
          </button>
        </div>
      </div>
    </Link>
  );
}

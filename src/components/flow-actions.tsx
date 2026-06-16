"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Heart, Bookmark, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { toggleLike, toggleSteal } from "@/lib/actions";
import { cn } from "@/lib/utils";

export function FlowActions({
  flowId,
  likeCount,
  stealCount,
  liked,
  stolen,
}: {
  flowId: string;
  likeCount: number;
  stealCount: number;
  liked: boolean;
  stolen: boolean;
}) {
  const t = useTranslations("flow");
  const tAuth = useTranslations("auth");
  const router = useRouter();
  const [, start] = useTransition();
  const [like, setLike] = useState({ on: liked, n: likeCount });
  const [steal, setSteal] = useState({ on: stolen, n: stealCount });

  function engage(kind: "like" | "steal") {
    const action = kind === "like" ? toggleLike : toggleSteal;
    const setter = kind === "like" ? setLike : setSteal;
    const cur = kind === "like" ? like : steal;
    setter({ on: !cur.on, n: cur.n + (cur.on ? -1 : 1) });
    start(async () => {
      const res = await action(flowId);
      if (!res.ok) {
        setter(cur);
        if (res.error === "auth") {
          toast.error(tAuth("loginRequired"));
          router.push("/login");
        }
      }
    });
  }

  async function share() {
    await navigator.clipboard.writeText(window.location.href);
    toast.success(t("linkCopied"));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant={like.on ? "default" : "outline"}
        onClick={() => engage("like")}
      >
        <Heart className={cn("h-4 w-4", like.on && "fill-current")} />
        {t("like")} · {like.n}
      </Button>
      <Button
        variant={steal.on ? "default" : "outline"}
        onClick={() => engage("steal")}
      >
        <Bookmark className={cn("h-4 w-4", steal.on && "fill-current")} />
        {steal.on ? t("stolen") : t("steal")} · {steal.n}
      </Button>
      <Button variant="ghost" size="icon" onClick={share} title={t("share")}>
        <Share2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { UserPlus, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { toggleFollow } from "@/lib/actions";

export function FollowButton({
  profileId,
  initialFollowing,
  size = "default",
}: {
  profileId: string;
  initialFollowing: boolean;
  size?: "default" | "sm";
}) {
  const t = useTranslations("flow");
  const tAuth = useTranslations("auth");
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [, start] = useTransition();

  function onClick() {
    const prev = following;
    setFollowing(!prev);
    start(async () => {
      const res = await toggleFollow(profileId);
      if (!res.ok) {
        setFollowing(prev);
        if (res.error === "auth") {
          toast.error(tAuth("loginRequired"));
          router.push("/login");
        }
      }
    });
  }

  return (
    <Button
      variant={following ? "secondary" : "outline"}
      size={size}
      onClick={onClick}
    >
      {following ? (
        <>
          <UserCheck className="h-4 w-4" />
          {t("following")}
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          {t("follow")}
        </>
      )}
    </Button>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { LogOut, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Link, useRouter } from "@/i18n/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/utils";

interface Props {
  profileId: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
}

export function UserNav({ profileId, fullName, avatarUrl, isAdmin }: Props) {
  const t = useTranslations("nav");
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  }

  return (
    <div className="flex items-center gap-1.5">
      {isAdmin && (
        <Button asChild variant="ghost" size="icon" title={t("admin")}>
          <Link href="/admin">
            <ShieldCheck className="h-4 w-4" />
          </Link>
        </Button>
      )}
      {profileId && (
        <Link href={`/profile/${profileId}`} aria-label={t("profile")}>
          <Avatar className="h-9 w-9 border border-border">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName ?? ""} />}
            <AvatarFallback>{initials(fullName)}</AvatarFallback>
          </Avatar>
        </Link>
      )}
      <Button variant="ghost" size="icon" onClick={signOut} title={t("logout")}>
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}

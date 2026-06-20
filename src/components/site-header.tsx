"use client";

import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { UserNav } from "@/components/user-nav";
import { Button } from "@/components/ui/button";

const PUBLIC_PREFIXES = ["/login", "/register", "/forgot-password", "/reset-password"];

export function SiteHeader({
  signedIn,
  profileId,
  fullName,
  avatarUrl,
  isAdmin,
}: {
  signedIn: boolean;
  profileId: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
}) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  // Public/auth screens render no application navigation.
  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Logo />

        <div className="flex items-center gap-1.5">
          <LanguageSwitcher />
          {signedIn ? (
            <>
              <Button
                asChild
                size="sm"
                className="hidden rounded-full font-semibold sm:inline-flex"
              >
                <Link href="/generate" className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  {t("create")}
                </Link>
              </Button>
              <UserNav
                profileId={profileId}
                fullName={fullName}
                avatarUrl={avatarUrl}
                isAdmin={isAdmin}
              />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">{t("login")}</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full font-semibold">
                <Link href="/login?mode=signup">{t("signup")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

import { getTranslations } from "next-intl/server";
import { Compass, Plus, Sparkles, Library } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { UserNav } from "@/components/user-nav";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const t = await getTranslations("nav");
  const user = await getCurrentUser();

  const links = [
    { href: "/feed", label: t("feed"), icon: Compass },
    { href: "/generate", label: t("generate"), icon: Sparkles },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Button key={l.href} asChild variant="ghost" size="sm">
                <Link href={l.href} className="gap-1.5">
                  <l.icon className="h-4 w-4" />
                  {l.label}
                </Link>
              </Button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <LanguageSwitcher />
          {user ? (
            <>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/create" className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  {t("create")}
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="hidden sm:inline-flex"
                title={t("library")}
              >
                <Link href="/library">
                  <Library className="h-4 w-4" />
                </Link>
              </Button>
              <UserNav
                profileId={user.profile?.id ?? null}
                fullName={user.profile?.full_name ?? user.email ?? null}
                avatarUrl={user.profile?.avatar_url ?? null}
                isAdmin={isAdmin(user)}
              />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">{t("login")}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/login?mode=signup">{t("signup")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, localeLabels, type Locale } from "@/i18n/routing";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  const next = routing.locales.find((l) => l !== locale) ?? locale;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5"
      onClick={() => router.replace(pathname, { locale: next })}
      aria-label={`Switch to ${localeLabels[next]}`}
    >
      <Languages className="h-4 w-4" />
      <span className="label-mono">{localeLabels[next]}</span>
    </Button>
  );
}

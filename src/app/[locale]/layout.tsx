import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Bebas_Neue, Manrope, Heebo, Space_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { routing, localeDirection, type Locale } from "@/i18n/routing";
import { SiteHeader } from "@/components/site-header";
import { BottomNav } from "@/components/bottom-nav";
import { StealOverlay } from "@/components/steal-overlay";
import { getCurrentUser } from "@/lib/auth";
import "../globals.css";

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas",
  display: "swap",
});
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});
const heebo = Heebo({
  subsets: ["latin", "hebrew"],
  weight: ["400", "500", "700", "800", "900"],
  variable: "--font-heebo",
  display: "swap",
});
const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Steal My Flow — discover & steal the best class flows",
  description:
    "A premium social platform where fitness & wellness instructors discover, save and create professional class flows. Powered by AI.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const dir = localeDirection[locale as Locale];
  const user = await getCurrentUser();

  return (
    <html
      lang={locale}
      dir={dir}
      className={`dark ${bebas.variable} ${manrope.variable} ${heebo.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans min-h-screen">
        <NextIntlClientProvider>
          <SiteHeader
            signedIn={!!user}
            profileId={user?.profile?.id ?? null}
            fullName={user?.profile?.full_name ?? user?.email ?? null}
            avatarUrl={user?.profile?.avatar_url ?? null}
            isAdmin={user?.profile?.role === "admin"}
          />
          <main
            className={`min-h-[calc(100vh-4rem)] ${user ? "pb-24 md:pb-0" : ""}`}
          >
            {children}
          </main>
          {user && (
            <BottomNav signedIn profileId={user?.profile?.id ?? null} />
          )}
          <StealOverlay />
          <Toaster
            theme="dark"
            position={dir === "rtl" ? "bottom-left" : "bottom-right"}
            toastOptions={{ className: "font-sans" }}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

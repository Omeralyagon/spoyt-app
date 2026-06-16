import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Frank_Ruhl_Libre, Heebo, Space_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { routing, localeDirection, type Locale } from "@/i18n/routing";
import { SiteHeader } from "@/components/site-header";
import "../globals.css";

const serif = Frank_Ruhl_Libre({
  subsets: ["latin", "hebrew"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-serif",
  display: "swap",
});
const sans = Heebo({
  subsets: ["latin", "hebrew"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});
const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Steal My Flow — a living library of class flows",
  description:
    "Discover, save and reuse complete class flows from fitness & wellness instructors worldwide. Generate new flows with AI.",
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

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${serif.variable} ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans min-h-screen paper-grain">
        <NextIntlClientProvider>
          <SiteHeader />
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
          <Toaster
            position={dir === "rtl" ? "bottom-left" : "bottom-right"}
            toastOptions={{ className: "font-sans" }}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

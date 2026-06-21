import { getTranslations, setRequestLocale } from "next-intl/server";
import { Sparkles, Bookmark, UserPlus, ArrowRight, LogIn } from "lucide-react";
import { Link, redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Logged-in users skip the marketing landing and go straight to the home screen.
  const user = await getCurrentUser();
  if (user) redirect({ href: "/feed", locale });

  const t = await getTranslations("home");

  const features = [
    { icon: Bookmark, title: t("feature1Title"), body: t("feature1Body") },
    { icon: UserPlus, title: t("feature2Title"), body: t("feature2Body") },
    { icon: Sparkles, title: t("feature3Title"), body: t("feature3Body") },
  ];
  const steps = [t("step1"), t("step2"), t("step3")];

  return (
    <div>
      {/* Hero */}
      <section className="container relative overflow-hidden py-20 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <p className="label-mono mb-6 text-primary">{t("heroKicker")}</p>
          <h1 className="font-display text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            {t("heroTitle")}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            {t("heroSubtitle")}
          </p>
          <div className="mt-9 flex justify-center">
            <Button asChild size="lg">
              <Link href="/login" className="gap-2">
                <LogIn className="h-5 w-5" />
                {t("ctaAuth")}
              </Link>
            </Button>
          </div>
        </div>

        {/* quiet decorative breath-line, echoing the Kinetic Stillness plate */}
        <svg
          className="pointer-events-none absolute inset-x-0 -bottom-6 -z-10 mx-auto h-40 w-full max-w-5xl opacity-50"
          viewBox="0 0 1000 160"
          fill="none"
          aria-hidden
        >
          <path
            d="M0 90 C 120 20, 200 150, 320 90 S 520 20, 640 90 S 840 150, 1000 70"
            stroke="hsl(var(--primary))"
            strokeWidth="1.25"
            strokeOpacity="0.7"
          />
          <path
            d="M0 110 C 120 40, 200 170, 320 110 S 520 40, 640 110 S 840 170, 1000 90"
            stroke="hsl(var(--foreground))"
            strokeWidth="1.25"
            strokeOpacity="0.35"
          />
        </svg>
      </section>

      {/* Features */}
      <section className="container py-12 md:py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="bg-card/60">
              <CardContent className="p-7">
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="container py-12 md:py-20">
        <h2 className="text-center font-display text-3xl font-medium tracking-tight">
          {t("stepsTitle")}
        </h2>
        <ol className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={i} className="relative text-center">
              <span className="label-mono text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="mt-3 text-base text-foreground/90">{s}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12 text-center">
          <Button asChild variant="link" className="text-base">
            <Link href="/login" className="gap-1.5">
              {t("ctaAuth")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("nav");
  return (
    <div className="container flex min-h-[70vh] flex-col items-center justify-center text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/mascot.png" alt="" className="mb-5 h-20 w-20 opacity-80" />
      <h2 className="font-display text-4xl">404</h2>
      <p className="mt-2 text-muted-foreground">
        This flow could not be found.
      </p>
      <Button asChild className="mt-6 rounded-full">
        <Link href="/feed">{t("home")}</Link>
      </Button>
    </div>
  );
}

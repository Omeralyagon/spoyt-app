import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth";
import { CreateFlowForm } from "@/components/create-flow-form";

export const dynamic = "force-dynamic";

export default async function CreatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) {
    redirect({ href: "/login", locale });
    return null;
  }

  const t = await getTranslations("create");

  return (
    <div className="container max-w-3xl py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-medium tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </header>
      <CreateFlowForm userId={user.id} />
    </div>
  );
}

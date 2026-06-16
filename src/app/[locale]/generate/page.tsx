import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AiStudio } from "@/components/ai-studio";
import type { AiGeneration } from "@/types/database";

async function getHistory(userId: string): Promise<AiGeneration[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("ai_generations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);
    return (data ?? []) as AiGeneration[];
  } catch {
    return [];
  }
}

export const dynamic = "force-dynamic";

export default async function GeneratePage({
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

  const t = await getTranslations("ai");
  const history = await getHistory(user.id);

  return (
    <div className="container py-10">
      <header className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-primary">
          <span className="label-mono">AI</span>
        </div>
        <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </header>
      <AiStudio history={history} />
    </div>
  );
}

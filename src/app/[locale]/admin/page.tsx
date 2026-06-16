import { getTranslations, setRequestLocale } from "next-intl/server";
import { ShieldCheck, FileText } from "lucide-react";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getPendingCertifications } from "@/lib/queries";
import { initials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/empty-state";
import { CertReview } from "@/components/cert-review";
import type { Certification, Profile } from "@/types/database";

type Row = Certification & { profile: Profile | null };

export const dynamic = "force-dynamic";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!isAdmin(user)) redirect({ href: "/feed", locale });

  const t = await getTranslations("admin");
  const pending = (await getPendingCertifications()) as unknown as Row[];

  return (
    <div className="container max-w-3xl py-10">
      <header className="mb-8 flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
      </header>

      {pending.length === 0 ? (
        <EmptyState icon={ShieldCheck} title={t("noPending")} />
      ) : (
        <ul className="space-y-3">
          {pending.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-border">
                  {c.profile?.avatar_url && (
                    <AvatarImage src={c.profile.avatar_url} alt="" />
                  )}
                  <AvatarFallback>
                    {initials(c.profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {c.profile?.full_name ?? t("instructor")}
                  </p>
                  <a
                    href={c.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {t("viewFile")}
                  </a>
                </div>
              </div>
              <CertReview certId={c.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

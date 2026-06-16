import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BadgeCheck, FileCheck2, Compass } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import {
  getProfileView,
  getProfileCertifications,
  getViewerEngagement,
} from "@/lib/queries";
import { initials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FlowCard } from "@/components/flow-card";
import { FollowButton } from "@/components/follow-button";
import { CertUpload } from "@/components/cert-upload";
import { EmptyState } from "@/components/empty-state";
import type { Certification } from "@/types/database";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("profile");

  const user = await getCurrentUser();
  const view = await getProfileView(id, user?.id);
  if (!view) notFound();

  const isOwn = user?.profile?.id === id;
  const [certs, engagement] = await Promise.all([
    isOwn
      ? (getProfileCertifications(id) as Promise<Certification[]>)
      : Promise.resolve([] as Certification[]),
    user ? getViewerEngagement(user.id) : Promise.resolve({ liked: [], stolen: [] }),
  ]);
  const liked = new Set(engagement.liked);
  const stolen = new Set(engagement.stolen);

  const { profile } = view;

  return (
    <div className="container max-w-5xl py-10">
      {/* header */}
      <div className="flex flex-col items-center gap-5 border-b border-border/70 pb-8 text-center sm:flex-row sm:text-start">
        <Avatar className="h-24 w-24 border border-border">
          {profile.avatar_url && (
            <AvatarImage src={profile.avatar_url} alt="" />
          )}
          <AvatarFallback className="text-2xl">
            {initials(profile.full_name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h1 className="font-display text-2xl font-medium">
              {profile.full_name ?? "—"}
            </h1>
            {profile.verified && (
              <Badge className="gap-1">
                <BadgeCheck className="h-3.5 w-3.5" />
                {locale === "he" ? "מאומת" : "Verified"}
              </Badge>
            )}
          </div>
          {profile.specialization && (
            <p className="mt-1 text-sm text-primary">{profile.specialization}</p>
          )}
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">
            {profile.bio ?? t("noBio")}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-6 sm:justify-start">
            <Stat n={view.flows.length} label={t("flows")} />
            <Stat n={view.followers} label={t("followers")} />
            <Stat n={view.following} label={t("following")} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {!isOwn && user && (
            <FollowButton profileId={id} initialFollowing={view.isFollowing} />
          )}
          {isOwn && user && (
            <CertUpload profileId={id} userId={user.id} />
          )}
        </div>
      </div>

      {/* own certifications */}
      {isOwn && certs.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-xl">{t("certifications")}</h2>
          <ul className="space-y-2">
            {certs.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 text-sm"
              >
                <span className="inline-flex items-center gap-2">
                  <FileCheck2 className="h-4 w-4 text-muted-foreground" />
                  {c.title ?? "Certificate"}
                </span>
                <Badge
                  variant={
                    c.status === "approved"
                      ? "default"
                      : c.status === "rejected"
                        ? "muted"
                        : "secondary"
                  }
                >
                  {t(
                    c.status === "approved"
                      ? "certApproved"
                      : c.status === "rejected"
                        ? "certRejected"
                        : "certPending",
                  )}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* flows */}
      <section className="mt-8">
        <h2 className="mb-5 font-display text-xl">{t("flows")}</h2>
        {view.flows.length ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {view.flows.map((f) => (
              <FlowCard
                key={f.id}
                flow={f}
                liked={liked.has(f.id)}
                stolen={stolen.has(f.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState icon={Compass} title="—" />
        )}
      </section>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="text-center">
      <p className="font-display text-xl font-medium">{n}</p>
      <p className="label-mono text-muted-foreground">{label}</p>
    </div>
  );
}

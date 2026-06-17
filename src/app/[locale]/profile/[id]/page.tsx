import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  BadgeCheck,
  FileCheck2,
  Compass,
  Zap,
  Heart,
  Users,
  Flame,
  Trophy,
  Star,
} from "lucide-react";
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
    user
      ? getViewerEngagement(user.id)
      : Promise.resolve({ liked: [], stolen: [], following: [] }),
  ]);
  const liked = new Set(engagement.liked);
  const stolen = new Set(engagement.stolen);

  const { profile, flows } = view;

  // derived metrics
  const totalSteals = flows.reduce((s, f) => s + f.steal_count, 0);
  const totalLikes = flows.reduce((s, f) => s + f.like_count, 0);
  const influence =
    view.followers * 3 + totalSteals * 2 + totalLikes + flows.length * 5;
  const featured = [...flows]
    .sort((a, b) => b.steal_count - a.steal_count)
    .slice(0, 3);
  const specializations = (profile.specialization ?? "")
    .split(/[,/]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const achievements = [
    profile.verified && { icon: BadgeCheck, label: t("verifiedPro") },
    flows.length >= 5 && { icon: Trophy, label: t("flowMaster") },
    totalSteals >= 10 && { icon: Flame, label: t("topCreator") },
    view.followers >= 3 && { icon: Star, label: t("risingStar") },
  ].filter(Boolean) as { icon: typeof Star; label: string }[];

  const coverFlow = featured[0];

  return (
    <div className="pb-10">
      {/* hero cover */}
      <div className="relative h-44 w-full overflow-hidden sm:h-60">
        {coverFlow?.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverFlow.cover_image}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/30 via-card to-secondary/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      <div className="container -mt-16 animate-fade-up">
        {/* identity */}
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-end sm:text-start">
          <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
            {profile.avatar_url && (
              <AvatarImage src={profile.avatar_url} alt="" />
            )}
            <AvatarFallback className="text-3xl">
              {initials(profile.full_name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 pb-1">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="font-display text-3xl tracking-tight">
                {profile.full_name ?? "—"}
              </h1>
              {profile.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
                  <BadgeCheck className="h-4 w-4" />
                  {t("verifiedPro")}
                </span>
              )}
            </div>
            {specializations.length > 0 && (
              <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                {specializations.map((s) => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 pb-1">
            {!isOwn && user && (
              <FollowButton profileId={id} initialFollowing={view.isFollowing} />
            )}
            {isOwn && user && <CertUpload profileId={id} userId={user.id} />}
          </div>
        </div>

        {/* bio */}
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {profile.bio ?? t("noBio")}
        </p>

        {/* stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile icon={Compass} n={flows.length} label={t("flows")} />
          <StatTile icon={Users} n={view.followers} label={t("followers")} />
          <StatTile icon={Zap} n={totalSteals} label={t("steals")} accent />
          <StatTile icon={Heart} n={totalLikes} label={t("likes")} />
        </div>

        {/* influence score */}
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-3">
            <Flame className="h-6 w-6 text-primary" />
            <div>
              <p className="label-mono text-muted-foreground">
                {t("influence")}
              </p>
              <p className="font-display text-2xl text-primary">{influence}</p>
            </div>
          </div>
          {achievements.length > 0 && (
            <div className="flex flex-wrap items-center justify-end gap-2">
              {achievements.map((a) => (
                <span
                  key={a.label}
                  className="inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-xs font-medium text-foreground/90"
                  title={a.label}
                >
                  <a.icon className="h-3.5 w-3.5 text-primary" />
                  <span className="hidden sm:inline">{a.label}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* own certifications */}
        {isOwn && certs.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 font-display text-xl">{t("certifications")}</h2>
            <ul className="space-y-2">
              {certs.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-sm"
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

        {/* featured flows */}
        {featured.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 font-display text-xl">{t("featured")}</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((f) => (
                <FlowCard
                  key={f.id}
                  flow={f}
                  liked={liked.has(f.id)}
                  stolen={stolen.has(f.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* all flows */}
        <section className="mt-8">
          <h2 className="mb-4 font-display text-xl">{t("flows")}</h2>
          {flows.length ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {flows.map((f) => (
                <FlowCard
                  key={f.id}
                  flow={f}
                  liked={liked.has(f.id)}
                  stolen={stolen.has(f.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={Compass} title={t("noBio")} />
          )}
        </section>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  n,
  label,
  accent,
}: {
  icon: typeof Zap;
  n: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center">
      <Icon
        className={`mx-auto mb-1 h-5 w-5 ${accent ? "text-primary" : "text-muted-foreground"}`}
      />
      <p className="font-display text-2xl">{n}</p>
      <p className="label-mono text-muted-foreground">{label}</p>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  BadgeCheck,
  Compass,
  Users,
  Zap,
  Heart,
  Flame,
  Trophy,
  Star,
  Sparkles,
  FileCheck2,
  Clock,
  CalendarDays,
  Camera,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/lib/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlowCard } from "@/components/flow-card";
import { FollowButton } from "@/components/follow-button";
import { CertUpload } from "@/components/cert-upload";
import { EditProfileDialog } from "@/components/edit-profile-dialog";
import { EmptyState } from "@/components/empty-state";
import { cn, initials, formatCount, isVideo } from "@/lib/utils";
import type { FlowCard as FlowCardData } from "@/lib/queries";
import type { Certification, Profile } from "@/types/database";

interface Props {
  profile: Profile;
  isOwn: boolean;
  isAuthed: boolean;
  userId: string | null;
  initialFollowing: boolean;
  stats: {
    flows: number;
    followers: number;
    steals: number;
    likes: number;
    influence: number;
  };
  flows: FlowCardData[];
  saved: FlowCardData[];
  featured: FlowCardData[];
  certs: Certification[];
  liked: string[];
  stolen: string[];
  locale: string;
}

const SPEC_STYLE: Record<string, { emoji: string; grad: string }> = {
  Yoga: { emoji: "🧘", grad: "from-emerald-500 to-teal-700" },
  "Vinyasa Yoga": { emoji: "🌊", grad: "from-lime-500 to-emerald-700" },
  "Power Yoga": { emoji: "⚡", grad: "from-orange-500 to-rose-700" },
  Pilates: { emoji: "🤸", grad: "from-fuchsia-500 to-purple-700" },
  "Pilates Reformer": { emoji: "🎛️", grad: "from-violet-500 to-indigo-700" },
  Barre: { emoji: "🩰", grad: "from-pink-500 to-rose-700" },
  "Functional Training": { emoji: "🔥", grad: "from-amber-500 to-orange-700" },
  HIIT: { emoji: "💥", grad: "from-red-500 to-rose-800" },
  Strength: { emoji: "💪", grad: "from-sky-500 to-blue-800" },
  Mobility: { emoji: "🤍", grad: "from-cyan-500 to-teal-700" },
  Stretching: { emoji: "🧠", grad: "from-green-500 to-emerald-800" },
};

export function ProfileScreen(props: Props) {
  const { profile, isOwn, isAuthed, stats, flows, saved, featured, certs } =
    props;
  const t = useTranslations("profile");
  const tf = useTranslations("flow");
  const tc = useTranslations("common");
  const router = useRouter();

  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverBusy, setCoverBusy] = useState(false);

  /** Upload a new banner (image or video) straight from the profile page. */
  async function onCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !props.userId) return;
    setCoverBusy(true);
    try {
      const supabase = createClient();
      const ext = f.name.split(".").pop() || "bin";
      const path = `${props.userId}/profile/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("covers")
        .upload(path, f, { upsert: true });
      if (error) throw new Error(error.message);
      const url = supabase.storage.from("covers").getPublicUrl(path)
        .data.publicUrl;
      const res = await updateProfile({ cover_url: url });
      if (!res.ok) throw new Error("save_failed");
      toast.success(tc("saved"));
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message || tc("somethingWrong"));
    } finally {
      setCoverBusy(false);
    }
  }

  async function removeCover() {
    setCoverBusy(true);
    try {
      const res = await updateProfile({ cover_url: null });
      if (!res.ok) throw new Error("save_failed");
      toast.success(tc("saved"));
      router.refresh();
    } catch {
      toast.error(tc("somethingWrong"));
    } finally {
      setCoverBusy(false);
    }
  }

  const liked = new Set(props.liked);
  const stolen = new Set(props.stolen);

  const specializations = (profile.specialization ?? "")
    .split(/[,/]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const achievements = [
    profile.verified && { icon: BadgeCheck, label: t("verifiedPro") },
    stats.flows >= 5 && { icon: Trophy, label: t("flowMaster") },
    stats.steals >= 10 && { icon: Flame, label: t("topCreator") },
    stats.followers >= 3 && { icon: Star, label: t("risingStar") },
  ].filter(Boolean) as { icon: typeof Star; label: string }[];

  // parallax cover
  const coverRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const coverY = useTransform(scrollY, [0, 300], [0, 60]);
  const coverScale = useTransform(scrollY, [0, 300], [1, 1.15]);

  // Dedicated profile banner first; otherwise fall back to a featured cover.
  const coverImage = profile.cover_url ?? featured[0]?.cover_image ?? null;
  const memberYear = new Date(profile.created_at).getFullYear();

  return (
    <div className="pb-12">
      {/* ============ HERO ============ */}
      <div
        ref={coverRef}
        className="group relative h-[38vh] min-h-[260px] w-full overflow-hidden"
      >
        <motion.div
          style={{ y: coverY, scale: coverScale }}
          className="absolute inset-0"
        >
          {coverImage ? (
            isVideo(coverImage) ? (
              <video
                src={coverImage}
                className="h-full w-full object-cover"
                muted
                loop
                autoPlay
                playsInline
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverImage}
                alt=""
                className="h-full w-full object-cover"
              />
            )
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/30 via-card to-secondary/30" />
          )}
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/10" />

        {/* owner banner controls — always visible on mobile, on hover for desktop */}
        {isOwn && props.userId && (
          <div className="absolute end-3 top-3 z-20 flex gap-2 opacity-100 transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100">
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={coverBusy}
              aria-label={t("cover")}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition-colors hover:bg-black/80 disabled:opacity-60"
            >
              {coverBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
            {profile.cover_url && (
              <button
                type="button"
                onClick={removeCover}
                disabled={coverBusy}
                aria-label={t("removeCover")}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition-colors hover:bg-black/80 disabled:opacity-60"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={onCoverChange}
            />
          </div>
        )}
      </div>

      <div className="container -mt-20">
        {/* avatar + identity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center"
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 18 }}
          >
            <Avatar className="h-32 w-32 border-4 border-background shadow-2xl">
              {profile.avatar_url && (
                <AvatarImage src={profile.avatar_url} alt="" />
              )}
              <AvatarFallback className="text-4xl">
                {initials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
          </motion.div>

          <h1 className="mt-4 font-display text-4xl tracking-tight">
            {profile.full_name ?? "—"}
          </h1>

          {profile.verified && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary">
              <BadgeCheck className="h-4 w-4" />
              {t("verifiedPro")}
            </span>
          )}

          {specializations.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {specializations.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* bio */}
          {(profile.bio || isOwn) && (
            <p className="mt-4 max-w-xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {profile.bio ?? t("noBio")}
            </p>
          )}

          {/* CTAs */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {!isOwn && isAuthed && (
              <FollowButton
                profileId={profile.id}
                initialFollowing={props.initialFollowing}
                size="default"
              />
            )}
            {featured[0] && (
              <Link
                href={`/flow/${featured[0].id}`}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground glow-primary"
              >
                <Zap className="h-4 w-4" />
                {tf("steal")}
              </Link>
            )}
            {isOwn && userIdGuard(props.userId) && (
              <>
                <EditProfileDialog
                  userId={props.userId}
                  fullName={profile.full_name}
                  bio={profile.bio}
                  specialization={profile.specialization}
                  avatarUrl={profile.avatar_url}
                  coverUrl={profile.cover_url}
                />
                <CertUpload profileId={profile.id} userId={props.userId} />
              </>
            )}
          </div>
        </motion.div>

        {/* ============ STATS ============ */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          <StatTile icon={Compass} value={stats.flows} label={t("flows")} />
          <StatTile icon={Users} value={stats.followers} label={t("followers")} />
          <StatTile icon={Zap} value={stats.steals} label={t("steals")} accent />
        </div>

        {/* ============ INFLUENCE + ACHIEVEMENTS ============ */}
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <InfluenceRing score={stats.influence} label={t("influence")} />
          <div className="flex-1 rounded-2xl border border-border bg-card p-4">
            <p className="label-mono mb-3 text-muted-foreground">
              {t("achievements")}
            </p>
            {achievements.length ? (
              <div className="flex flex-wrap gap-2">
                {achievements.map((a, i) => (
                  <motion.span
                    key={a.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
                  >
                    <a.icon className="h-3.5 w-3.5" />
                    {a.label}
                  </motion.span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </div>
        </div>

        {/* ============ SPECIALIZATIONS (horizontal) ============ */}
        {specializations.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 font-display text-xl">{t("specialization")}</h2>
            <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
              {specializations.map((s) => {
                const st = SPEC_STYLE[s] ?? {
                  emoji: "✨",
                  grad: "from-slate-500 to-slate-800",
                };
                return (
                  <Link
                    key={s}
                    href={`/feed?category=${encodeURIComponent(s)}`}
                    className={cn(
                      "relative flex h-24 w-40 shrink-0 flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-br p-3 transition-transform hover:scale-[1.03]",
                      st.grad,
                    )}
                  >
                    <span className="absolute end-2 top-2 text-2xl">
                      {st.emoji}
                    </span>
                    <span className="font-display text-lg leading-tight text-white">
                      {s}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ============ FEATURED ============ */}
        {featured.length > 0 && (
          <section className="mt-8">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl">{t("featured")}</h2>
            </div>
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

        {/* ============ TABS ============ */}
        <section className="mt-10">
          <Tabs defaultValue="flows">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="flows">{t("flows")}</TabsTrigger>
              <TabsTrigger value="saved">{tc("saved") || "Saved"}</TabsTrigger>
              <TabsTrigger value="about">{t("about")}</TabsTrigger>
              <TabsTrigger value="certs">{t("certifications")}</TabsTrigger>
            </TabsList>

            <TabsContent value="flows">
              <FlowGrid
                flows={flows}
                liked={liked}
                stolen={stolen}
                empty={t("noBio")}
              />
            </TabsContent>

            <TabsContent value="saved">
              <FlowGrid
                flows={saved}
                liked={liked}
                stolen={stolen}
                empty={tf("steal")}
              />
            </TabsContent>

            <TabsContent value="about">
              <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
                <div>
                  <p className="label-mono mb-1 text-muted-foreground">
                    {t("about")}
                  </p>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                    {profile.bio ?? t("noBio")}
                  </p>
                </div>
                {specializations.length > 0 && (
                  <div>
                    <p className="label-mono mb-1 text-muted-foreground">
                      {t("specialization")}
                    </p>
                    <p className="text-sm">{specializations.join(" · ")}</p>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  {memberYear}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="certs">
              {certs.length ? (
                <ul className="space-y-2">
                  {certs.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 text-sm"
                    >
                      <span className="inline-flex items-center gap-2">
                        <FileCheck2 className="h-4 w-4 text-muted-foreground" />
                        {c.title ?? "Certificate"}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                          c.status === "approved"
                            ? "bg-primary/15 text-primary"
                            : c.status === "rejected"
                              ? "bg-muted text-muted-foreground"
                              : "bg-secondary/15 text-secondary",
                        )}
                      >
                        {c.status === "approved" && (
                          <BadgeCheck className="h-3.5 w-3.5" />
                        )}
                        {t(
                          c.status === "approved"
                            ? "certApproved"
                            : c.status === "rejected"
                              ? "certRejected"
                              : "certPending",
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : profile.verified ? (
                <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-primary">
                  <BadgeCheck className="h-5 w-5" />
                  {t("verifiedPro")}
                </div>
              ) : (
                <EmptyState icon={FileCheck2} title="—" />
              )}
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </div>
  );
}

function userIdGuard(id: string | null): id is string {
  return !!id;
}

function FlowGrid({
  flows,
  liked,
  stolen,
  empty,
}: {
  flows: FlowCardData[];
  liked: Set<string>;
  stolen: Set<string>;
  empty: string;
}) {
  if (!flows.length) return <EmptyState icon={Compass} title={empty} />;
  return (
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
  );
}

function StatTile({
  icon: Icon,
  value,
  label,
  accent,
}: {
  icon: typeof Zap;
  value: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        "rounded-2xl border bg-card p-4 text-center",
        accent ? "border-primary/40" : "border-border",
      )}
    >
      <Icon
        className={cn(
          "mx-auto mb-1 h-5 w-5",
          accent ? "text-primary" : "text-muted-foreground",
        )}
      />
      <p className={cn("font-display text-3xl", accent && "text-primary")}>
        <CountUp value={value} />
      </p>
      <p className="label-mono text-muted-foreground">{label}</p>
    </motion.div>
  );
}

function CountUp({ value }: { value: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 900;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{formatCount(n)}</>;
}

function InfluenceRing({ score, label }: { score: number; label: string }) {
  const clamped = Math.max(0, Math.min(100, score));
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:w-56">
      <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="7"
        />
        <motion.circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c * (1 - clamped / 100) }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      <div>
        <p className="label-mono text-muted-foreground">{label}</p>
        <p className="font-display text-2xl text-primary">
          <CountUp value={clamped} />
          <span className="text-base text-muted-foreground">/100</span>
        </p>
      </div>
    </div>
  );
}

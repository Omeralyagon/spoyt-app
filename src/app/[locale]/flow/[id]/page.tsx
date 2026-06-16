import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Clock, Gauge, Layers, BadgeCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getFlowById } from "@/lib/queries";
import { youtubeId, initials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FlowActions } from "@/components/flow-actions";
import { FollowButton } from "@/components/follow-button";

export default async function FlowPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("flow");
  const td = await getTranslations("difficulty");
  const tc = await getTranslations("common");

  const user = await getCurrentUser();
  const flow = await getFlowById(id, user?.id);
  if (!flow) notFound();

  const vid = youtubeId(flow.youtube_url);
  const isOwn = flow.creator?.id && flow.creator.id === user?.profile?.id;

  return (
    <article className="container max-w-4xl py-10">
      {/* cover */}
      <div className="relative mb-8 aspect-[21/9] overflow-hidden rounded-xl bg-muted">
        {flow.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={flow.cover_image}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-accent to-secondary">
            <span className="font-display text-3xl text-foreground/25">
              {flow.category}
            </span>
          </div>
        )}
        <Badge className="absolute start-4 top-4 bg-background/85 backdrop-blur">
          {flow.category}
        </Badge>
      </div>

      <h1 className="font-display text-3xl font-medium leading-tight tracking-tight md:text-4xl">
        {flow.title}
      </h1>

      {/* meta */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-4 w-4" /> {flow.duration_minutes} {tc("minutes")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Gauge className="h-4 w-4" /> {td(flow.difficulty)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Layers className="h-4 w-4" /> {flow.steps.length} {t("structure")}
        </span>
      </div>

      {/* creator + actions */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-border/70 py-4">
        {flow.creator && (
          <div className="flex items-center gap-3">
            <Link href={`/profile/${flow.creator.id}`}>
              <Avatar className="h-11 w-11 border border-border">
                {flow.creator.avatar_url && (
                  <AvatarImage src={flow.creator.avatar_url} alt="" />
                )}
                <AvatarFallback>
                  {initials(flow.creator.full_name)}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <p className="label-mono text-muted-foreground">
                {t("byInstructor")}
              </p>
              <Link
                href={`/profile/${flow.creator.id}`}
                className="inline-flex items-center gap-1.5 font-medium hover:underline"
              >
                {flow.creator.full_name ?? "—"}
                {flow.creator.verified && (
                  <BadgeCheck className="h-4 w-4 text-primary" />
                )}
              </Link>
            </div>
            {!isOwn && (
              <div className="ms-2">
                <FollowButton
                  profileId={flow.creator.id}
                  initialFollowing={flow.followingCreator}
                  size="sm"
                />
              </div>
            )}
          </div>
        )}
        <FlowActions
          flowId={flow.id}
          likeCount={flow.like_count}
          stealCount={flow.steal_count}
          liked={flow.likedByMe}
          stolen={flow.stolenByMe}
        />
      </div>

      {flow.description && (
        <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-foreground/90">
          {flow.description}
        </p>
      )}

      {/* video */}
      {vid && (
        <div className="mt-8 aspect-video overflow-hidden rounded-xl border border-border">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${vid}`}
            title={flow.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* structure */}
      {flow.steps.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-5 font-display text-2xl font-medium">
            {t("structure")}
          </h2>
          <ol className="space-y-3">
            {flow.steps.map((step, i) => (
              <li
                key={step.id}
                className="flex gap-4 rounded-lg border border-border bg-card p-4"
              >
                <span className="label-mono mt-0.5 text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-medium">{step.title}</h3>
                    {step.duration_minutes ? (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {step.duration_minutes} {tc("minutes")}
                      </span>
                    ) : null}
                  </div>
                  {step.content && (
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {step.content}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </article>
  );
}

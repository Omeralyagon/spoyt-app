import { getTranslations, setRequestLocale } from "next-intl/server";
import { Compass } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getFeedFlows, getViewerEngagement } from "@/lib/queries";
import { ImmersiveFeed, type FeedItem } from "@/components/immersive-feed";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function FeedPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sort?: string; category?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { sort: sortParam, category } = await searchParams;
  const sort = sortParam === "new" ? "new" : "hot";

  const t = await getTranslations("feed");
  const user = await getCurrentUser();

  const [flows, engagement] = await Promise.all([
    getFeedFlows(sort, category),
    user
      ? getViewerEngagement(user.id)
      : Promise.resolve({ liked: [], stolen: [], following: [] }),
  ]);
  const liked = new Set(engagement.liked);
  const stolen = new Set(engagement.stolen);
  const following = new Set(engagement.following);

  if (flows.length === 0) {
    return (
      <div className="container py-16">
        <EmptyState
          icon={Compass}
          title={t("empty")}
          action={
            <Button asChild>
              <Link href="/create">{t("title")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const items: FeedItem[] = flows.map((flow) => ({
    flow,
    liked: liked.has(flow.id),
    stolen: stolen.has(flow.id),
    following: flow.creator ? following.has(flow.creator.id) : false,
  }));

  return <ImmersiveFeed items={items} />;
}

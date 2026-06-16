import { getTranslations, setRequestLocale } from "next-intl/server";
import { Compass } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getFeedFlows, getViewerEngagement } from "@/lib/queries";
import { FlowCard } from "@/components/flow-card";
import { FeedControls } from "@/components/feed-controls";
import { EmptyState } from "@/components/empty-state";

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
    user ? getViewerEngagement(user.id) : Promise.resolve({ liked: [], stolen: [] }),
  ]);
  const liked = new Set(engagement.liked);
  const stolen = new Set(engagement.stolen);

  return (
    <div className="container py-10">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-medium tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="mb-7">
        <FeedControls sort={sort} category={category} />
      </div>

      {flows.length === 0 ? (
        <EmptyState icon={Compass} title={t("empty")} />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {flows.map((flow) => (
            <FlowCard
              key={flow.id}
              flow={flow}
              liked={liked.has(flow.id)}
              stolen={stolen.has(flow.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

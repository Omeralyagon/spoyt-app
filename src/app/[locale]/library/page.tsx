import { getTranslations, setRequestLocale } from "next-intl/server";
import { Bookmark, PenLine, Sparkles } from "lucide-react";
import { redirect, Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getLibrary, getViewerEngagement } from "@/lib/queries";
import { FlowCard } from "@/components/flow-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export default async function LibraryPage({
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

  const t = await getTranslations("library");
  const [lib, engagement] = await Promise.all([
    getLibrary(user.id, user.profile?.id ?? null),
    getViewerEngagement(user.id),
  ]);
  const liked = new Set(engagement.liked);
  const stolen = new Set(engagement.stolen);

  const grid = "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className="container py-10">
      <h1 className="mb-8 font-serif text-3xl font-medium tracking-tight">
        {t("title")}
      </h1>

      <Tabs defaultValue="created">
        <TabsList>
          <TabsTrigger value="created">
            {t("created")} ({lib.created.length})
          </TabsTrigger>
          <TabsTrigger value="saved">
            {t("saved")} ({lib.saved.length})
          </TabsTrigger>
          <TabsTrigger value="generated">
            {t("generated")} ({lib.generated.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="created">
          {lib.created.length ? (
            <div className={grid}>
              {lib.created.map((f) => (
                <FlowCard
                  key={f.id}
                  flow={f}
                  liked={liked.has(f.id)}
                  stolen={stolen.has(f.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={PenLine}
              title={t("emptyCreated")}
              action={
                <Button asChild>
                  <Link href="/create">{t("created")}</Link>
                </Button>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="saved">
          {lib.saved.length ? (
            <div className={grid}>
              {lib.saved.map((f) => (
                <FlowCard
                  key={f.id}
                  flow={f}
                  liked={liked.has(f.id)}
                  stolen={stolen.has(f.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Bookmark}
              title={t("emptySaved")}
              action={
                <Button asChild variant="outline">
                  <Link href="/feed">{t("saved")}</Link>
                </Button>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="generated">
          {lib.generated.length ? (
            <ul className="space-y-3">
              {lib.generated.map((g) => {
                const content = g.generated_content as { title?: string };
                return (
                  <li
                    key={g.id}
                    className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {content?.title ?? g.prompt}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {g.prompt}
                      </p>
                    </div>
                    {g.saved_flow_id && (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/flow/${g.saved_flow_id}`}>
                          {t("saved")}
                        </Link>
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              icon={Sparkles}
              title={t("emptyGenerated")}
              action={
                <Button asChild>
                  <Link href="/generate">{t("generated")}</Link>
                </Button>
              }
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

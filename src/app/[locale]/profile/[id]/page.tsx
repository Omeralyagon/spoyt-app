import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getProfileView,
  getProfileCertifications,
  getStolenFlowsByUser,
  getViewerEngagement,
} from "@/lib/queries";
import { ProfileScreen } from "@/components/profile-screen";
import type { Certification } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  const view = await getProfileView(id, user?.id);
  if (!view) notFound();

  const isOwn = user?.profile?.id === id;

  const [certs, saved, engagement] = await Promise.all([
    isOwn
      ? (getProfileCertifications(id) as Promise<Certification[]>)
      : Promise.resolve([] as Certification[]),
    getStolenFlowsByUser(view.profile.user_id),
    user
      ? getViewerEngagement(user.id)
      : Promise.resolve({ liked: [], stolen: [], following: [] }),
  ]);

  const { profile, flows } = view;
  const totalSteals = flows.reduce((s, f) => s + f.steal_count, 0);
  const totalLikes = flows.reduce((s, f) => s + f.like_count, 0);
  const influence = Math.min(
    100,
    view.followers * 4 + totalSteals * 3 + totalLikes + flows.length * 5,
  );
  const featured = [...flows]
    .sort((a, b) => b.steal_count - a.steal_count)
    .slice(0, 3);

  return (
    <ProfileScreen
      profile={profile}
      isOwn={isOwn}
      isAuthed={!!user}
      userId={user?.id ?? null}
      initialFollowing={view.isFollowing}
      stats={{
        flows: flows.length,
        followers: view.followers,
        steals: totalSteals,
        likes: totalLikes,
        influence,
      }}
      flows={flows}
      saved={saved}
      featured={featured}
      certs={certs}
      liked={engagement.liked}
      stolen={engagement.stolen}
      locale={locale}
    />
  );
}

import { createClient } from "@/lib/supabase/server";
import { flowScore } from "@/lib/utils";
import type { Flow, FlowStep, Profile, AiGeneration } from "@/types/database";

export interface FlowCreator {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  verified: boolean;
}

export interface FlowCard extends Flow {
  creator: FlowCreator | null;
  like_count: number;
  steal_count: number;
}

type Embedded = Flow & {
  creator: FlowCreator | null;
  likes: { count: number }[];
  steals: { count: number }[];
};

const FLOW_SELECT =
  "*, creator:profiles!flows_creator_id_fkey(id,full_name,avatar_url,verified), likes(count), steals(count)";

function shape(row: Embedded): FlowCard {
  const { likes, steals, ...rest } = row;
  return {
    ...rest,
    like_count: likes?.[0]?.count ?? 0,
    steal_count: steals?.[0]?.count ?? 0,
  };
}

export async function getFeedFlows(
  sort: "hot" | "new" = "hot",
  category?: string,
): Promise<FlowCard[]> {
  try {
    const supabase = await createClient();
    let q = supabase
      .from("flows")
      .select(FLOW_SELECT)
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(60);
    if (category) q = q.eq("category", category);

    const { data, error } = await q;
    if (error || !data) return [];
    const cards = (data as unknown as Embedded[]).map(shape);

    if (sort === "hot") {
      cards.sort(
        (a, b) =>
          flowScore({
            likes: b.like_count,
            steals: b.steal_count,
            createdAt: b.created_at,
          }) -
          flowScore({
            likes: a.like_count,
            steals: a.steal_count,
            createdAt: a.created_at,
          }),
      );
    }
    return cards;
  } catch {
    return [];
  }
}

export interface FlowDetail extends FlowCard {
  steps: FlowStep[];
  likedByMe: boolean;
  stolenByMe: boolean;
  followingCreator: boolean;
}

export async function getFlowById(
  id: string,
  viewerId?: string,
): Promise<FlowDetail | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("flows")
      .select(FLOW_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;

    const card = shape(data as unknown as Embedded);

    const { data: steps } = await supabase
      .from("flow_steps")
      .select("*")
      .eq("flow_id", id)
      .order("order_index", { ascending: true });

    let likedByMe = false;
    let stolenByMe = false;
    let followingCreator = false;
    if (viewerId) {
      const [{ data: l }, { data: s }, { data: f }] = await Promise.all([
        supabase
          .from("likes")
          .select("flow_id")
          .eq("flow_id", id)
          .eq("user_id", viewerId)
          .maybeSingle(),
        supabase
          .from("steals")
          .select("flow_id")
          .eq("flow_id", id)
          .eq("user_id", viewerId)
          .maybeSingle(),
        card.creator
          ? supabase
              .from("follows")
              .select("following_id")
              .eq("follower_id", viewerId)
              .eq("following_id", card.creator.id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      likedByMe = !!l;
      stolenByMe = !!s;
      followingCreator = !!f;
    }

    return {
      ...card,
      steps: (steps ?? []) as FlowStep[],
      likedByMe,
      stolenByMe,
      followingCreator,
    };
  } catch {
    return null;
  }
}

export interface ProfileView {
  profile: Profile;
  flows: FlowCard[];
  followers: number;
  following: number;
  isFollowing: boolean;
}

export async function getProfileView(
  profileId: string,
  viewerId?: string,
): Promise<ProfileView | null> {
  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .maybeSingle();
    if (!profile) return null;

    const [{ data: flows }, { count: followers }, { count: following }] =
      await Promise.all([
        supabase
          .from("flows")
          .select(FLOW_SELECT)
          .eq("creator_id", profileId)
          .eq("visibility", "public")
          .order("created_at", { ascending: false }),
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", profileId),
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", (profile as Profile).user_id),
      ]);

    let isFollowing = false;
    if (viewerId) {
      const { data } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", viewerId)
        .eq("following_id", profileId)
        .maybeSingle();
      isFollowing = !!data;
    }

    return {
      profile: profile as Profile,
      flows: ((flows ?? []) as unknown as Embedded[]).map(shape),
      followers: followers ?? 0,
      following: following ?? 0,
      isFollowing,
    };
  } catch {
    return null;
  }
}

export async function getStolenFlowsByUser(
  userId: string,
): Promise<FlowCard[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("steals")
      .select(`flow:flows(${FLOW_SELECT})`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return ((data ?? []) as unknown as { flow: Embedded }[])
      .map((r) => r.flow)
      .filter((f) => f && f.visibility === "public")
      .map(shape);
  } catch {
    return [];
  }
}

export async function getProfileCertifications(profileId: string) {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("certifications")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false });
    return data ?? [];
  } catch {
    return [];
  }
}

export interface LibraryData {
  created: FlowCard[];
  saved: FlowCard[];
  generated: AiGeneration[];
}

export async function getLibrary(
  userId: string,
  profileId: string | null,
): Promise<LibraryData> {
  try {
    const supabase = await createClient();
    const [createdRes, savedRes, genRes] = await Promise.all([
      profileId
        ? supabase
            .from("flows")
            .select(FLOW_SELECT)
            .eq("creator_id", profileId)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      supabase
        .from("steals")
        .select(`flow:flows(${FLOW_SELECT})`)
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("ai_generations")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    const saved = ((savedRes.data ?? []) as unknown as { flow: Embedded }[])
      .map((r) => r.flow)
      .filter(Boolean)
      .map(shape);

    return {
      created: ((createdRes.data ?? []) as unknown as Embedded[]).map(shape),
      saved,
      generated: (genRes.data ?? []) as AiGeneration[],
    };
  } catch {
    return { created: [], saved: [], generated: [] };
  }
}

export async function getViewerEngagement(
  userId: string,
): Promise<{ liked: string[]; stolen: string[]; following: string[] }> {
  try {
    const supabase = await createClient();
    const [{ data: likes }, { data: steals }, { data: follows }] =
      await Promise.all([
        supabase.from("likes").select("flow_id").eq("user_id", userId),
        supabase.from("steals").select("flow_id").eq("user_id", userId),
        supabase.from("follows").select("following_id").eq("follower_id", userId),
      ]);
    return {
      liked: (likes ?? []).map((r) => r.flow_id as string),
      stolen: (steals ?? []).map((r) => r.flow_id as string),
      following: (follows ?? []).map((r) => r.following_id as string),
    };
  } catch {
    return { liked: [], stolen: [], following: [] };
  }
}

export async function getPendingCertifications() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("certifications")
      .select("*, profile:profiles!certifications_profile_id_fkey(*)")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    return data ?? [];
  } catch {
    return [];
  }
}

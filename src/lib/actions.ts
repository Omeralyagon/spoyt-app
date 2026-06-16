"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateFlow, buildPromptString, type FlowRequest } from "@/lib/ai";
import type { GeneratedFlow } from "@/types/database";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/**
 * Returns the current user's profile id, creating the profile row if it is
 * missing (e.g. the user signed up before the DB trigger existed).
 */
async function ensureProfileId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> },
): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (data?.id) return data.id;

  const meta = user.user_metadata ?? {};
  const fullName =
    (meta.full_name as string) ||
    (meta.name as string) ||
    user.email?.split("@")[0] ||
    null;
  const { data: created } = await supabase
    .from("profiles")
    .insert({
      user_id: user.id,
      full_name: fullName,
      avatar_url: (meta.avatar_url as string) ?? null,
    })
    .select("id")
    .single();
  return created?.id ?? null;
}

// ---------------------------------------------------------------- engagement
export async function toggleLike(flowId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "auth" as const };

  const { data: existing } = await supabase
    .from("likes")
    .select("flow_id")
    .eq("flow_id", flowId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("likes").delete().eq("flow_id", flowId).eq("user_id", user.id);
    return { ok: true, active: false };
  }
  await supabase.from("likes").insert({ flow_id: flowId, user_id: user.id });
  return { ok: true, active: true };
}

export async function toggleSteal(flowId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "auth" as const };

  const { data: existing } = await supabase
    .from("steals")
    .select("flow_id")
    .eq("flow_id", flowId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("steals").delete().eq("flow_id", flowId).eq("user_id", user.id);
    return { ok: true, active: false };
  }
  await supabase.from("steals").insert({ flow_id: flowId, user_id: user.id });
  return { ok: true, active: true };
}

export async function toggleFollow(profileId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "auth" as const };

  const { data: existing } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id)
    .eq("following_id", profileId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", profileId);
    return { ok: true, active: false };
  }
  await supabase
    .from("follows")
    .insert({ follower_id: user.id, following_id: profileId });
  return { ok: true, active: true };
}

// ---------------------------------------------------------------- create flow
export interface CreateFlowInput {
  title: string;
  category: string;
  difficulty: string;
  duration_minutes: number;
  description?: string;
  cover_image?: string;
  youtube_url?: string;
  visibility: "public" | "private";
  steps: { title: string; content?: string; duration_minutes?: number }[];
}

async function insertFlowWithSteps(
  supabase: Awaited<ReturnType<typeof createClient>>,
  creatorId: string,
  input: CreateFlowInput,
) {
  const { data: flow, error } = await supabase
    .from("flows")
    .insert({
      creator_id: creatorId,
      title: input.title,
      description: input.description || null,
      category: input.category,
      difficulty: input.difficulty as CreateFlowInput["difficulty"] as never,
      duration_minutes: input.duration_minutes,
      cover_image: input.cover_image || null,
      youtube_url: input.youtube_url || null,
      visibility: input.visibility,
    })
    .select("id")
    .single();
  if (error || !flow) throw new Error(error?.message ?? "insert failed");

  if (input.steps.length) {
    await supabase.from("flow_steps").insert(
      input.steps.map((s, i) => ({
        flow_id: flow.id,
        order_index: i,
        title: s.title,
        content: s.content || null,
        duration_minutes: s.duration_minutes ?? null,
      })),
    );
  }
  return flow.id as string;
}

export async function createFlow(input: CreateFlowInput) {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false as const, error: "auth" };
  const profileId = await ensureProfileId(supabase, user);
  if (!profileId) return { ok: false as const, error: "profile" };

  try {
    const id = await insertFlowWithSteps(supabase, profileId, input);
    revalidatePath("/", "layout");
    return { ok: true as const, id };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

// ---------------------------------------------------------------- AI studio
export async function generateFlowAction(req: FlowRequest) {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false as const, error: "auth" };

  try {
    const flow = await generateFlow(req);
    const { data, error } = await supabase
      .from("ai_generations")
      .insert({
        user_id: user.id,
        prompt: buildPromptString(req),
        params: req as never,
        generated_content: flow as never,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true as const, generationId: data.id as string, flow };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

export async function saveGeneratedFlow(
  generationId: string,
  flow: GeneratedFlow,
) {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false as const, error: "auth" };
  const profileId = await ensureProfileId(supabase, user);
  if (!profileId) return { ok: false as const, error: "profile" };

  try {
    const id = await insertFlowWithSteps(supabase, profileId, {
      title: flow.title,
      category: flow.category,
      difficulty: flow.difficulty,
      duration_minutes: flow.duration_minutes,
      description: flow.summary,
      visibility: "public",
      steps: flow.steps,
    });
    await supabase
      .from("ai_generations")
      .update({ saved_flow_id: id })
      .eq("id", generationId)
      .eq("user_id", user.id);
    revalidatePath("/", "layout");
    return { ok: true as const, id };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

// ---------------------------------------------------------------- admin
export async function reviewCertification(
  certId: string,
  status: "approved" | "rejected",
) {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false as const, error: "auth" };

  const { data: cert, error } = await supabase
    .from("certifications")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("id", certId)
    .select("profile_id")
    .single();
  if (error) return { ok: false as const, error: error.message };

  if (status === "approved" && cert) {
    await supabase
      .from("profiles")
      .update({ verified: true })
      .eq("id", cert.profile_id);
  }
  revalidatePath("/", "layout");
  return { ok: true as const };
}

// ---------------------------------------------------------------- profile
export async function updateProfile(input: {
  full_name?: string;
  bio?: string;
  specialization?: string;
  avatar_url?: string;
}) {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false as const, error: "auth" };
  await supabase.from("profiles").update(input).eq("user_id", user.id);
  revalidatePath("/", "layout");
  return { ok: true as const };
}

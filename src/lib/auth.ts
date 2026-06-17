import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export interface CurrentUser {
  id: string;
  email?: string;
  profile: Profile | null;
}

/** Returns the signed-in user + profile, or null. Never throws.
 *  Auto-creates the profile row on first sight (covers users who signed up
 *  before the DB trigger existed). */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    let { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) {
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const { data: created } = await supabase
        .from("profiles")
        .insert({
          user_id: user.id,
          full_name:
            (meta.full_name as string) ||
            (meta.name as string) ||
            user.email?.split("@")[0] ||
            null,
          avatar_url: (meta.avatar_url as string) ?? null,
        })
        .select("*")
        .single();
      profile = created ?? null;
    }

    return { id: user.id, email: user.email, profile: profile ?? null };
  } catch {
    return null;
  }
}

export function isAdmin(user: CurrentUser | null): boolean {
  return user?.profile?.role === "admin";
}

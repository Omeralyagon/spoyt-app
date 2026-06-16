import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export interface CurrentUser {
  id: string;
  email?: string;
  profile: Profile | null;
}

/** Returns the signed-in user + profile, or null. Never throws. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    return { id: user.id, email: user.email, profile: profile ?? null };
  } catch {
    return null;
  }
}

export function isAdmin(user: CurrentUser | null): boolean {
  return user?.profile?.role === "admin";
}

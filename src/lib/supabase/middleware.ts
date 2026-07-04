import { createServerClient } from "@supabase/ssr";
import { type NextRequest, type NextResponse } from "next/server";

/**
 * Refreshes the Supabase auth session and copies the updated cookies onto the
 * response produced by the next-intl middleware. No-ops gracefully when
 * Supabase env vars are not configured yet (e.g. first-run / preview).
 */
export async function updateSession(
  request: NextRequest,
  response: NextResponse,
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Touch the user to keep the session fresh — but never let a slow or
  // unreachable Supabase hang the middleware, which would 504 the ENTIRE app
  // (MIDDLEWARE_INVOCATION_TIMEOUT). Bound it and fail open.
  try {
    await Promise.race([
      supabase.auth.getUser(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("supabase-auth-timeout")), 3000),
      ),
    ]);
  } catch {
    // Session not refreshed this request — return anyway so the app still loads.
  }
  return response;
}

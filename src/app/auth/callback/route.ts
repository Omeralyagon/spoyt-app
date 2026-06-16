import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// OAuth / email-confirmation callback. Exchanges the code for a session
// (cookies are writable in a route handler) and redirects into the app.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/en";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(`${origin}${next}`);
}

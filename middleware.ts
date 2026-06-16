import createMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";
import { routing } from "./src/i18n/routing";
import { updateSession } from "./src/lib/supabase/middleware";

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  return await updateSession(request, response);
}

export const config = {
  // Run on everything except static assets, API routes and files.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

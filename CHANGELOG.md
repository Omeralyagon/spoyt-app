# Changelog

## [Unreleased] — Production hardening pass

### Fixed
- **auth:** public/auth screens (`/login`, etc.) no longer render the app
  navigation (top bar + bottom nav are hidden for unauthenticated routes).
- **profile:** added missing **avatar upload** + full profile editing
  (name, bio, specialization) via a dialog backed by Supabase Storage.
- **profile:** auto-create the profile row on session, fixing blank/404
  profiles for accounts created before the DB trigger existed.
- **uploads:** certificate & avatar uploads now surface the **real** storage
  error instead of a generic "Something went wrong".
- **ai:** replaced raw provider errors with safe, user-facing messages
  (quota / rate-limit / timeout / config / parse / unknown).
- **ai:** removed fragile `output_config`; robust JSON parsing + normalization
  so generated flows always satisfy DB constraints.
- **flow publishing:** auto-create profile before insert; surface real errors.

### Added
- **ai:** Google **Gemini** as a free-tier provider (`AI_PROVIDER=gemini`),
  alongside Claude (default) and OpenAI — fully swappable, server-side only.
- **discover:** premium redesign using 11 dedicated category artworks with
  overlaid titles, search, and Framer Motion animations.
- **observability:** structured JSON logger (`src/lib/logger.ts`) with
  timestamp / action / status / userId / duration / errorCode / errorMessage,
  wired into flow creation and AI generation.
- **db:** `supabase/migrations/0003_idempotent_setup.sql` — a single,
  re-runnable script that guarantees storage buckets and every RLS policy
  exist and are correct (run it to repair uploads/publishing).
- **ux:** global + per-segment error boundaries and a styled not-found page.

### Security
- All AI keys and the Supabase service role remain **server-side only**
  (server actions); never shipped to the client.
- RLS enforced on all eight tables; storage policies scope certificate files
  to their owner; `is_admin()` guards moderation.

### Notes
- AI generation requires an AI provider key in the environment
  (`GEMINI_API_KEY` for the free tier) on Vercel.
- If uploads or publishing fail on a fresh project, run
  `supabase/migrations/0003_idempotent_setup.sql` once.

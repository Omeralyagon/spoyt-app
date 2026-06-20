# Steal My Flow — Implementation Report (production hardening pass)

## 1. Root cause analysis

| Area | Symptom | Root cause | Fix |
|---|---|---|---|
| Auth UX | App nav shown on login screen | Nav rendered unconditionally in the locale layout | Header + bottom nav now hide on public routes (`/login`, …) |
| Profile photo | "doesn't work" | Feature did not exist | Built `EditProfileDialog` (avatar upload → Storage + profile update) |
| Blank profile | Empty/black profile | Missing `profiles` row (signup pre-trigger) → `notFound()` | `getCurrentUser()` auto-creates the profile; styled not-found + error boundary |
| Uploads | "Something went wrong" | Storage bucket / RLS policy missing **or** generic catch hid the cause | Surface real storage error; `0003` migration guarantees buckets + policies |
| Flow publishing | Fails silently | Missing profile / RLS, generic error | Auto-create profile, surface real error, `0003` ensures `flows`/`flow_steps` policies |
| AI generation | Raw `400 credit balance too low` | No provider credits + raw error shown | Friendly error mapping; added free **Gemini** provider; robust JSON parse |

## 2. Dependency map

```
User
 └─ Auth (Supabase Auth: email + Google OAuth, middleware session refresh)
     └─ Profile (auto-created; avatar via Storage)
         ├─ Flow Creation ── flows + flow_steps (RLS by creator)
         ├─ AI Studio ── server action → AI provider → ai_generations → flows
         └─ Storage (avatars / covers / certifications buckets)
             └─ Database (Postgres + RLS on all 8 tables)
```

## 3. Files changed (highlights)
- `src/components/site-header.tsx`, `bottom-nav.tsx` — hide nav on public routes.
- `src/components/edit-profile-dialog.tsx`, `ui/dialog.tsx` — avatar/profile edit.
- `src/lib/auth.ts` — auto-create profile.
- `src/lib/ai.ts` — Gemini provider, robust parsing, `friendlyAiError`.
- `src/lib/actions.ts` — logging + friendly AI errors + profile auto-create.
- `src/lib/logger.ts` — structured logging.
- `src/components/discover-screen.tsx` + `public/categories/*` — Discover redesign.
- `src/app/[locale]/error.tsx`, `global-error.tsx`, `not-found.tsx` — error UX.

## 4. Database / storage changes
- `supabase/migrations/0003_idempotent_setup.sql` — idempotent buckets + RLS repair.
- Buckets: `avatars` (public), `covers` (public), `certifications` (private).

## 5. Security
- Secrets server-side only; RLS on all tables; per-user certificate paths.

## 6. AI
- Providers: Gemini (free) / Claude / OpenAI, swappable via `AI_PROVIDER`.
- Server-side only; friendly errors; JSON output normalized to DB constraints.

## 7. Test results (local production build)
- `next build` passes; all routes compile.
- Route smoke test: `/`, `/en`, `/he`, `/feed`, `/discover`, `/login` → 200;
  `/generate` → redirect to login when unauthenticated.
- Full E2E (register → upload → publish → AI) requires the live Supabase +
  AI key; covered functionally in code with real-error surfacing.

## 8. Known limitations / remaining risks
- AI requires a provider key configured on Vercel (`GEMINI_API_KEY`).
- Uploads/publishing depend on the Supabase project having buckets + RLS —
  run `0003` once if a fresh project misbehaves.
- `forgot-password` / `reset-password` screens are routed-for but not built.

## 9. Future recommendations
- Add password reset pages; rate-limit AI per user; image CDN/resizing;
  Playwright E2E in CI; Sentry for error monitoring.

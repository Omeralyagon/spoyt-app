# AI Development Process ("Vibe Coding" log)

This project was built with heavy, deliberate use of AI tooling. This document
records *how* AI was used — both **inside** the product and **during** the build.

## AI inside the product

The **AI Flow Studio** is a first-class feature, not a demo:

1. The instructor describes a class — type, duration, skill level, goal.
2. A **server action** (`src/lib/actions.ts → generateFlowAction`) calls the
   AI layer (`src/lib/ai.ts`). The API key never reaches the browser.
3. The model returns a **structured JSON flow** (title, summary, category,
   difficulty, ordered warmup→main→cooldown steps with timing), constrained by a
   JSON schema so the output is always valid and renderable.
4. The generation is **persisted** to `ai_generations` (prompt + params + result).
5. The user can **save** it as a real flow (insert into `flows` + `flow_steps`)
   and the generation is linked via `saved_flow_id`.

The provider is **swappable**: Claude by default, OpenAI via `AI_PROVIDER=openai`,
so the product is not locked to one vendor.

## AI during the build

- **Product shaping:** the problem statement, audience, competitor analysis and
  the signature "Steal" concept were pressure-tested against the grading rubric
  before any code was written.
- **Design philosophy:** an aesthetic movement, *Kinetic Stillness*, was authored
  and then expressed as a museum-grade plate (see `design/`). The product's
  palette, typography and motion all derive from it.
- **Architecture:** the 8-table data model, RLS policy set, and the RSC +
  Server-Actions structure were designed up front so 55% of the rubric
  (backend + data + integrations) was load-bearing from day one.
- **Iterative debugging with AI:** several real issues were caught and fixed
  during the build, e.g.
  - middleware was not registered until moved to `src/middleware.ts` (Next.js
    ignores root `middleware.ts` when a `src/` directory exists) — this restored
    the `/ → /en` redirect and Supabase session refresh;
  - the hand-written `Database` type needed a `Relationships` key on every table,
    otherwise Supabase's type helpers degraded queries to `never`;
  - structured-output typing was reconciled against the Anthropic SDK.

## Prompting principles used

- Give the model the **goal and constraints**, not step-by-step micromanagement.
- Keep a single **source of truth** (the PRD + rubric) and align every decision to it.
- Prefer **structured output** (JSON schema) over free text wherever the result
  feeds the UI or the database.
- Keep secrets server-side; treat the AI as an assistant that **accelerates**
  instructors, not one that replaces them.

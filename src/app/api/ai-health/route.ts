import { NextResponse } from "next/server";
import { generateFlow, activeProvider, geminiKey } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/ai-health — self-diagnostic for AI generation.
 * Open in a browser to see which provider is active, which keys are present,
 * and the exact provider error if generation fails. No secrets are returned.
 */
export async function GET() {
  const env = {
    geminiKeyDetected: !!geminiKey(),
    hasGEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    hasGOOGLE_GENERATIVE_AI_API_KEY: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    hasGOOGLE_API_KEY: !!process.env.GOOGLE_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL ?? null,
  };
  const provider = activeProvider();

  try {
    const flow = await generateFlow({
      classType: "Yoga",
      durationMinutes: 20,
      level: "beginner",
      goals: "health check",
      locale: "en",
    });
    return NextResponse.json({
      ok: true,
      provider,
      env,
      sample: { title: flow.title, steps: flow.steps.length },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, provider, env, error: (e as Error).message },
      { status: 200 },
    );
  }
}

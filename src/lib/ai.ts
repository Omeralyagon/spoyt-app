import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { CATEGORIES, DIFFICULTIES, type Difficulty } from "./constants";
import type { GeneratedFlow } from "@/types/database";

/**
 * AI layer for Steal My Flow — generates a structured class flow.
 *
 * Provider-swappable: defaults to Claude (Anthropic). Set AI_PROVIDER=openai
 * to route through OpenAI instead. Server-only — API keys never reach the client.
 */

export interface FlowRequest {
  classType: string;
  durationMinutes: number;
  level: string;
  goals: string;
  locale?: "en" | "he";
}

const SYSTEM_PROMPT = `You are an expert fitness and wellness curriculum designer for "Steal My Flow", a platform used by professional yoga, Pilates, barre and functional-training instructors.

Design a single, well-structured class flow that a qualified instructor could teach as-is. Principles:
- Always include a warmup, a main section, and a cooldown — ordered as a sequence of steps.
- Each step has a clear title, concrete coaching content (cues, poses/exercises, breath, transitions), and a duration in minutes.
- The sum of step durations must equal the requested total duration.
- Match the requested discipline, difficulty level and goal precisely. Be specific and professional — no filler.
- Choose the single best-fitting category and difficulty from the allowed lists.`;

// JSON schema for structured output (kept within the supported subset).
const FLOW_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    category: { type: "string", enum: [...CATEGORIES] },
    difficulty: { type: "string", enum: [...DIFFICULTIES] },
    duration_minutes: { type: "integer" },
    steps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          content: { type: "string" },
          duration_minutes: { type: "integer" },
        },
        required: ["title", "content", "duration_minutes"],
      },
    },
  },
  required: [
    "title",
    "summary",
    "category",
    "difficulty",
    "duration_minutes",
    "steps",
  ],
} as const;

function buildUserPrompt(req: FlowRequest): string {
  const lang =
    req.locale === "he"
      ? "Write all titles and content in Hebrew."
      : "Write all titles and content in English.";
  return `Create a ${req.durationMinutes}-minute ${req.level} ${req.classType} class focused on: ${req.goals}.
${lang}
Return only the structured flow.`;
}

export function buildPromptString(req: FlowRequest): string {
  return `${req.durationMinutes}min ${req.level} ${req.classType} — goals: ${req.goals}`;
}

/** Maps any provider/network error to a safe, user-facing message + code. */
export function friendlyAiError(e: unknown): { code: string; message: string } {
  const raw = (e as Error)?.message?.toLowerCase() ?? "";
  if (raw.includes("credit") || raw.includes("quota") || raw.includes("billing"))
    return { code: "quota", message: "AI generation is temporarily unavailable (provider quota reached). Please try again later." };
  if (raw.includes("not configured") || raw.includes("api_key") || raw.includes("api key"))
    return { code: "config", message: "AI generation is not configured yet. Please add an AI key in the environment." };
  if (raw.includes("rate") || raw.includes("429") || raw.includes("overloaded"))
    return { code: "rate_limit", message: "AI is busy right now. Please try again in a few seconds." };
  if (raw.includes("timeout") || raw.includes("timed out") || raw.includes("network") || raw.includes("fetch"))
    return { code: "network", message: "The AI request timed out. Please try again." };
  if (raw.includes("json") || raw.includes("parse") || raw.includes("no content"))
    return { code: "parse", message: "The AI returned an unexpected response. Please try again." };
  return { code: "unknown", message: "AI lesson generation is temporarily unavailable. Please try again." };
}

const SHAPE_HINT = `Return ONLY a single JSON object (no markdown, no code fences, no prose) with exactly this shape:
{
  "title": string,
  "summary": string,
  "category": one of ${JSON.stringify(CATEGORIES)},
  "difficulty": one of ${JSON.stringify(DIFFICULTIES)},
  "duration_minutes": number,
  "steps": [ { "title": string, "content": string, "duration_minutes": number } ]
}`;

/** Robustly extract a JSON object from a model text response. */
function parseFlowJson(raw: string): GeneratedFlow {
  let s = raw.trim();
  // strip ```json ... ``` fences if present
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  // otherwise slice to the outermost braces
  if (!s.startsWith("{")) {
    const a = s.indexOf("{");
    const b = s.lastIndexOf("}");
    if (a !== -1 && b !== -1) s = s.slice(a, b + 1);
  }
  return JSON.parse(s) as GeneratedFlow;
}

async function generateWithAnthropic(req: FlowRequest): Promise<GeneratedFlow> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("AI is not configured (missing ANTHROPIC_API_KEY).");
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: `${SYSTEM_PROMPT}\n\n${SHAPE_HINT}`,
    messages: [{ role: "user", content: buildUserPrompt(req) }],
  });

  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") {
    throw new Error("AI returned no content");
  }
  return parseFlowJson(text.text);
}

async function generateWithOpenAI(req: FlowRequest): Promise<GeneratedFlow> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("AI is not configured (missing OPENAI_API_KEY).");
  }
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      response_format: {
        type: "json_schema",
        json_schema: { name: "flow", schema: FLOW_SCHEMA, strict: true },
      },
      messages: [
        { role: "system", content: `${SYSTEM_PROMPT}\n\n${SHAPE_HINT}` },
        { role: "user", content: buildUserPrompt(req) },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI ${res.status}: ${body.slice(0, 180)}`);
  }
  const data = await res.json();
  const text: string | undefined = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenAI returned no content");
  return parseFlowJson(text);
}

async function generateWithGemini(req: FlowRequest): Promise<GeneratedFlow> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("AI is not configured (missing GEMINI_API_KEY).");
  }
  // Try a few known-good models so a single model rename never breaks us.
  const models = [
    process.env.GEMINI_MODEL,
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
  ].filter(Boolean) as string[];

  let lastErr = "";
  for (const model of models) {
    const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
                  headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: `${SYSTEM_PROMPT}\n\n${SHAPE_HINT}` }] },
          contents: [{ role: "user", parts: [{ text: buildUserPrompt(req) }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
        }),
      },
    );
    if (res.ok) {
      const data = await res.json();
      const text: string | undefined =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Gemini returned no content");
      return parseFlowJson(text);
    }
    const body = await res.text();
    lastErr = `Gemini ${res.status}: ${body.slice(0, 180)}`;
    // model-not-found or quota → try the next model (lite models have higher
    // free limits); any other error stops immediately.
    if (res.status !== 404 && res.status !== 429) throw new Error(lastErr);
  }
  throw new Error(lastErr || "Gemini request failed");
}

/** Resolve the active provider: explicit env, else auto-detect by which key exists. */
export function activeProvider(): "anthropic" | "openai" | "gemini" {
  const explicit = process.env.AI_PROVIDER?.toLowerCase();
  if (explicit === "gemini" || explicit === "openai" || explicit === "anthropic")
    return explicit;
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "anthropic";
}

export async function generateFlow(req: FlowRequest): Promise<GeneratedFlow> {
  const provider = activeProvider();
  const flow =
    provider === "openai"
      ? await generateWithOpenAI(req)
      : provider === "gemini"
        ? await generateWithGemini(req)
        : await generateWithAnthropic(req);

  // Defensive normalization so the result always satisfies the DB constraints.
  if (!CATEGORIES.includes(flow.category as (typeof CATEGORIES)[number])) {
    flow.category = req.classType.includes("Yoga")
      ? "Yoga"
      : (CATEGORIES.find((c) => req.classType.includes(c)) ?? "Functional Training");
  }
  if (!DIFFICULTIES.includes(flow.difficulty)) {
    flow.difficulty = (DIFFICULTIES.includes(req.level as Difficulty)
      ? req.level
      : "all-levels") as Difficulty;
  }
  flow.steps = (flow.steps ?? []).map((s) => ({
    title: s.title ?? "Step",
    content: s.content ?? "",
    duration_minutes: Number(s.duration_minutes) || 0,
  }));

  const total = flow.steps.reduce((s, st) => s + (st.duration_minutes || 0), 0);
  if (total > 0 && total !== flow.duration_minutes) {
    flow.duration_minutes = total;
  }
  if (!flow.duration_minutes || flow.duration_minutes < 1) {
    flow.duration_minutes = req.durationMinutes;
  }
  return flow;
}

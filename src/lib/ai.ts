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
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      response_format: {
        type: "json_schema",
        json_schema: { name: "flow", schema: FLOW_SCHEMA, strict: true },
      },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(req) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content) as GeneratedFlow;
}

export async function generateFlow(req: FlowRequest): Promise<GeneratedFlow> {
  const provider = (process.env.AI_PROVIDER || "anthropic").toLowerCase();
  const flow =
    provider === "openai"
      ? await generateWithOpenAI(req)
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

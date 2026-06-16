#!/usr/bin/env node
/**
 * Seed demo data for Steal My Flow.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node supabase/seed.mjs
 *
 * Creates a demo admin + a few verified instructors and a library of flows.
 * Safe to re-run (users are upserted by email; flows are skipped if present).
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });
const PASSWORD = "demo1234";

async function ensureUser(email, meta, { admin = false } = {}) {
  // find existing
  const { data: list } = await db.auth.admin.listUsers();
  let user = list?.users?.find((u) => u.email === email);
  if (!user) {
    const { data, error } = await db.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: meta,
    });
    if (error) throw error;
    user = data.user;
  }
  // profile is auto-created by trigger; update fields
  await db
    .from("profiles")
    .update({
      full_name: meta.full_name,
      avatar_url: meta.avatar_url,
      bio: meta.bio ?? null,
      specialization: meta.specialization ?? null,
      verified: meta.verified ?? false,
      role: admin ? "admin" : "instructor",
    })
    .eq("user_id", user.id);
  const { data: profile } = await db
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  return { userId: user.id, profileId: profile.id };
}

async function addFlow(creatorId, flow) {
  const { data: existing } = await db
    .from("flows")
    .select("id")
    .eq("creator_id", creatorId)
    .eq("title", flow.title)
    .maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await db
    .from("flows")
    .insert({
      creator_id: creatorId,
      title: flow.title,
      description: flow.description,
      category: flow.category,
      difficulty: flow.difficulty,
      duration_minutes: flow.duration_minutes,
      cover_image: flow.cover_image ?? null,
      youtube_url: flow.youtube_url ?? null,
      visibility: "public",
    })
    .select("id")
    .single();
  if (error) throw error;
  await db.from("flow_steps").insert(
    flow.steps.map((s, i) => ({
      flow_id: data.id,
      order_index: i,
      title: s.t,
      content: s.c,
      duration_minutes: s.d,
    })),
  );
  return data.id;
}

const img = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`;

async function main() {
  console.log("Seeding…");

  const admin = await ensureUser(
    "admin@stealmyflow.app",
    { full_name: "Studio Admin", avatar_url: null },
    { admin: true },
  );

  const maya = await ensureUser("maya@stealmyflow.app", {
    full_name: "Maya Cohen",
    specialization: "Vinyasa & Power Yoga",
    bio: "RYT-500 teacher. I build breath-led flows for strength and ease.",
    verified: true,
    avatar_url: img("photo-1544005313-94ddf0286df2"),
  });
  const daniel = await ensureUser("daniel@stealmyflow.app", {
    full_name: "Daniel Levi",
    specialization: "Functional Training & HIIT",
    bio: "S&C coach. Efficient, joint-friendly sessions.",
    verified: true,
    avatar_url: img("photo-1500648767791-00dcc994a43e"),
  });
  const noa = await ensureUser("noa@stealmyflow.app", {
    full_name: "Noa Friedman",
    specialization: "Pilates & Mobility",
    bio: "Reformer & mat Pilates. Precision over intensity.",
    verified: false,
    avatar_url: img("photo-1438761681033-6461ffad8d80"),
  });

  const flows = [
    [maya.profileId, {
      title: "Morning Vinyasa for Flexibility",
      description: "A breath-led 45-minute flow to open hips and spine.",
      category: "Vinyasa Yoga", difficulty: "beginner", duration_minutes: 45,
      cover_image: img("photo-1506126613408-eca07ce68773"),
      youtube_url: "https://www.youtube.com/watch?v=v7AYKMP6rOE",
      steps: [
        { t: "Centering & breath", c: "Seated, lengthen the exhale. 5 rounds of ujjayi.", d: 5 },
        { t: "Sun salutations A", c: "5 rounds, linking breath to movement.", d: 12 },
        { t: "Standing flow", c: "Warrior II → side angle → triangle, both sides.", d: 15 },
        { t: "Hip openers", c: "Pigeon and lizard with long holds.", d: 8 },
        { t: "Savasana", c: "Rest and integrate.", d: 5 },
      ],
    }],
    [maya.profileId, {
      title: "Power Yoga: Core & Balance",
      description: "Strong, sweaty 50-minute build to a peak balance.",
      category: "Power Yoga", difficulty: "advanced", duration_minutes: 50,
      cover_image: img("photo-1575052814086-f385e2e2ad1b"),
      steps: [
        { t: "Warmup", c: "Cat/cow, plank breathing.", d: 8 },
        { t: "Build", c: "Chaturanga flows, chair twists.", d: 18 },
        { t: "Peak", c: "Crow → side crow attempts.", d: 14 },
        { t: "Cooldown", c: "Supine twists, forward fold.", d: 10 },
      ],
    }],
    [daniel.profileId, {
      title: "30-Minute Full-Body HIIT",
      description: "No equipment, four rounds, scalable intervals.",
      category: "HIIT", difficulty: "intermediate", duration_minutes: 30,
      cover_image: img("photo-1571019613454-1cb2f99b2d8b"),
      youtube_url: "https://www.youtube.com/watch?v=ml6cT4AZdqI",
      steps: [
        { t: "Dynamic warmup", c: "Leg swings, world's greatest stretch.", d: 5 },
        { t: "Round 1–2", c: "Squat jumps, push-ups, mountain climbers 40/20.", d: 12 },
        { t: "Round 3–4", c: "Lunges, burpees, plank shoulder taps 40/20.", d: 9 },
        { t: "Cooldown", c: "Walk it out, hamstring + chest stretch.", d: 4 },
      ],
    }],
    [daniel.profileId, {
      title: "Functional Strength Circuit",
      description: "Push, pull, hinge, carry — balanced full body.",
      category: "Functional Training", difficulty: "intermediate", duration_minutes: 40,
      cover_image: img("photo-1534438327276-14e5300c3a48"),
      steps: [
        { t: "Prep", c: "Banded activation for hips and shoulders.", d: 6 },
        { t: "Strength A", c: "Goblet squat + push-up, 4×8.", d: 14 },
        { t: "Strength B", c: "Hinge to row + carry, 4×8.", d: 14 },
        { t: "Finisher", c: "Farmer carries.", d: 6 },
      ],
    }],
    [noa.profileId, {
      title: "Mat Pilates for a Strong Core",
      description: "Classic mat sequence focused on deep core control.",
      category: "Pilates", difficulty: "all-levels", duration_minutes: 35,
      cover_image: img("photo-1518611012118-696072aa579a"),
      steps: [
        { t: "Breath & alignment", c: "Lateral breathing, neutral pelvis.", d: 5 },
        { t: "The hundred → roll up", c: "Control the tempo.", d: 12 },
        { t: "Single/double leg stretch", c: "Series of five.", d: 12 },
        { t: "Stretch out", c: "Spine stretch forward, rest.", d: 6 },
      ],
    }],
    [noa.profileId, {
      title: "Mobility Reset for Tight Hips",
      description: "Gentle 25-minute mobility flow for desk-bound bodies.",
      category: "Mobility", difficulty: "beginner", duration_minutes: 25,
      cover_image: img("photo-1599058917212-d750089bc07e"),
      steps: [
        { t: "CARs", c: "Controlled hip circles, both sides.", d: 8 },
        { t: "90/90 transitions", c: "Slow, with pauses.", d: 10 },
        { t: "Couch stretch", c: "Open hip flexors.", d: 7 },
      ],
    }],
  ];

  const flowIds = [];
  for (const [creator, flow] of flows) {
    flowIds.push(await addFlow(creator, flow));
  }

  // engagement: spread some likes/steals/follows
  const users = [maya, daniel, noa, admin];
  for (const f of flowIds) {
    for (const u of users) {
      await db.from("likes").upsert({ user_id: u.userId, flow_id: f }).select();
    }
    await db.from("steals").upsert({ user_id: admin.userId, flow_id: f }).select();
  }
  await db.from("follows").upsert({ follower_id: admin.userId, following_id: maya.profileId });
  await db.from("follows").upsert({ follower_id: daniel.userId, following_id: maya.profileId });

  console.log("Done. Demo logins (password: demo1234):");
  console.log("  admin@stealmyflow.app  (admin)");
  console.log("  maya@stealmyflow.app   (verified instructor)");
  console.log("  daniel@stealmyflow.app (verified instructor)");
  console.log("  noa@stealmyflow.app    (instructor)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

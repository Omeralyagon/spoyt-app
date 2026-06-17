"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CATEGORIES } from "@/lib/constants";

const STYLE: Record<string, { grad: string; emoji: string; h: string }> = {
  Yoga: { grad: "from-emerald-500 to-teal-700", emoji: "🧘", h: "h-72" },
  "Vinyasa Yoga": { grad: "from-lime-500 to-emerald-700", emoji: "🌊", h: "h-60" },
  "Power Yoga": { grad: "from-orange-500 to-rose-700", emoji: "⚡", h: "h-64" },
  Pilates: { grad: "from-fuchsia-500 to-purple-700", emoji: "🤸", h: "h-72" },
  "Pilates Reformer": { grad: "from-violet-500 to-indigo-700", emoji: "🎛️", h: "h-60" },
  Barre: { grad: "from-pink-500 to-rose-700", emoji: "🩰", h: "h-64" },
  "Functional Training": { grad: "from-amber-500 to-orange-700", emoji: "🔥", h: "h-72" },
  HIIT: { grad: "from-red-500 to-rose-800", emoji: "💥", h: "h-60" },
  Strength: { grad: "from-sky-500 to-blue-800", emoji: "💪", h: "h-72" },
  Mobility: { grad: "from-cyan-500 to-teal-700", emoji: "🤍", h: "h-60" },
  Stretching: { grad: "from-green-500 to-emerald-800", emoji: "🧠", h: "h-64" },
};

export function DiscoverScreen() {
  const t = useTranslations("discover");
  const [q, setQ] = useState("");

  const cats = CATEGORIES.filter((c) =>
    c.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <div className="container py-8">
      {/* header */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-display text-5xl tracking-tight">{t("title")}</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">{t("subtitle")}</p>
        <div className="relative mt-5 max-w-md">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-11 w-full rounded-full border border-border bg-card ps-10 pe-4 text-sm outline-none ring-primary/50 placeholder:text-muted-foreground focus:ring-2"
          />
        </div>
      </motion.header>

      {/* masonry grid */}
      <div className="columns-2 gap-3 md:columns-3 lg:columns-4 [&>*]:mb-3">
        {cats.map((cat, i) => {
          const s = STYLE[cat] ?? {
            grad: "from-slate-500 to-slate-800",
            emoji: "✨",
            h: "h-64",
          };
          return (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.4) }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="break-inside-avoid"
            >
              <Link
                href={`/feed?category=${encodeURIComponent(cat)}`}
                className={`relative flex ${s.h} w-full flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br ${s.grad} p-4 shadow-lg`}
              >
                <div className="flex items-start justify-between">
                  <h2 className="max-w-[70%] font-display text-2xl leading-none text-white drop-shadow">
                    {cat}
                  </h2>
                  <span className="text-2xl">{s.emoji}</span>
                </div>
                {/* mascot */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/mascot.png"
                  alt=""
                  className="pointer-events-none absolute -bottom-3 end-1 h-28 w-28 object-contain opacity-90 drop-shadow-2xl"
                  draggable={false}
                />
                <span className="relative z-10 text-xs font-semibold uppercase tracking-wider text-white/80">
                  Explore →
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

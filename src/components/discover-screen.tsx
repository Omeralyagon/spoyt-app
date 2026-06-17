"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { CATEGORIES } from "@/lib/constants";
import type { Category } from "@/lib/constants";

// Grid: 4 cols x 3 rows in discover-grid.png
// Row 0: Yoga(0,0), Vinyasa Yoga(1,0), Power Yoga(2,0), Pilates(3,0)
// Row 1: Pilates Reformer(0,1), Barre(1,1), Functional Training(2,1), HIIT(3,1)
// Row 2: Strength(0,2), Mobility(1,2), Stretching(2,2)
const GRID_POS: Record<string, { col: number; row: number }> = {
  "Yoga":                { col: 0, row: 0 },
  "Vinyasa Yoga":        { col: 1, row: 0 },
  "Power Yoga":          { col: 2, row: 0 },
  "Pilates":             { col: 3, row: 0 },
  "Pilates Reformer":    { col: 0, row: 1 },
  "Barre":               { col: 1, row: 1 },
  "Functional Training": { col: 2, row: 1 },
  "HIIT":                { col: 3, row: 1 },
  "Strength":            { col: 0, row: 2 },
  "Mobility":            { col: 1, row: 2 },
  "Stretching":          { col: 2, row: 2 },
};

const CARD_BG: Record<string, string> = {
  "Yoga":                "#0f9e6e",
  "Vinyasa Yoga":        "#2dbd3d",
  "Power Yoga":          "#e85c1a",
  "Pilates":             "#8a2be2",
  "Pilates Reformer":    "#7b2fd4",
  "Barre":               "#d42f7b",
  "Functional Training": "#e07318",
  "HIIT":                "#d42020",
  "Strength":            "#2060c8",
  "Mobility":            "#18a8a8",
  "Stretching":          "#1aad4a",
};

export function DiscoverScreen() {
  const t = useTranslations("discover");
  const router = useRouter();
  const [q, setQ] = useState("");

  const cats = CATEGORIES.filter((c) =>
    c.toLowerCase().includes(q.trim().toLowerCase())
  );

  function handleCategoryClick(cat: Category) {
    router.push(`/?category=${encodeURIComponent(cat)}`);
  }

  return (
    <div className="container py-8">
      {/* Header */}
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

      {/* Category Grid — mirrors discover-grid.png layout */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cats.map((cat, i) => {
          const pos = GRID_POS[cat];
          const bgColor = CARD_BG[cat] ?? "#333";
          // backgroundSize: 400% wide (4 cols) x 300% tall (3 rows)
          // backgroundPosition: col/3 * 100% and row/2 * 100%
          const bgX = pos ? `${(pos.col / 3) * 100}%` : "0%";
          const bgY = pos ? `${(pos.row / 2) * 100}%` : "0%";

          return (
            <motion.button
              key={cat}
              onClick={() => handleCategoryClick(cat as Category)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: i * 0.04,
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}
              whileHover={{ scale: 1.04, y: -4 }}
              whileTap={{ scale: 0.96 }}
              className="relative overflow-hidden rounded-2xl aspect-square cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 shadow-lg"
              style={{ backgroundColor: bgColor }}
            >
              {/* Mascot slice from grid */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: "url('/discover-grid.png')",
                  backgroundSize: "400% 300%",
                  backgroundPosition: `${bgX} ${bgY}`,
                  backgroundRepeat: "no-repeat",
                }}
              />
              {/* Label */}
              <div className="absolute inset-0 flex flex-col justify-start p-3 pointer-events-none">
                <span
                  className="font-black text-white uppercase tracking-wider leading-tight drop-shadow-lg"
                  style={{ fontSize: "clamp(0.6rem, 2vw, 0.85rem)" }}
                >
                  {cat}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

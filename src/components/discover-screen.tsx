"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Search, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CATEGORIES } from "@/lib/constants";

// Each category maps to its dedicated artwork in /public/categories.
const imgFor = (cat: string) => `/categories/${cat.replace(/ /g, "_")}.png`;

export function DiscoverScreen() {
  const t = useTranslations("discover");
  const [q, setQ] = useState("");

  const cats = CATEGORIES.filter((c) =>
    c.toLowerCase().includes(q.trim().toLowerCase()),
  );

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

      {/* Category cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cats.map((cat, i) => (
          <motion.div
            key={cat}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: Math.min(i * 0.04, 0.4),
              type: "spring",
              stiffness: 260,
              damping: 22,
            }}
            whileHover={{ scale: 1.04, y: -4 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link
              href={`/feed?category=${encodeURIComponent(cat)}`}
              className="group relative block aspect-square overflow-hidden rounded-3xl border border-border/40 shadow-lg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgFor(cat)}
                alt={cat}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                draggable={false}
              />
              {/* legibility gradient top + bottom */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/35" />
              {/* title */}
              <h2 className="absolute start-3 top-3 max-w-[80%] font-display text-lg uppercase leading-none tracking-wide text-white drop-shadow-lg sm:text-xl">
                {cat}
              </h2>
              {/* explore */}
              <span className="absolute bottom-3 end-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
                <ArrowRight className="h-3 w-3 rtl:rotate-180" />
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

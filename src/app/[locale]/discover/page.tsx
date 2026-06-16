import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CATEGORIES } from "@/lib/constants";

// Each discipline gets its own visual identity (Spotify-browse style).
const GRADIENTS: Record<string, string> = {
  Yoga: "from-emerald-500 to-teal-700",
  "Vinyasa Yoga": "from-lime-500 to-emerald-700",
  "Power Yoga": "from-orange-500 to-rose-700",
  Pilates: "from-fuchsia-500 to-purple-700",
  "Pilates Reformer": "from-violet-500 to-indigo-700",
  Barre: "from-pink-500 to-rose-700",
  "Functional Training": "from-amber-500 to-orange-700",
  HIIT: "from-red-500 to-rose-800",
  Strength: "from-sky-500 to-blue-800",
  Mobility: "from-cyan-500 to-teal-700",
  Stretching: "from-green-500 to-emerald-800",
};

export default async function DiscoverPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("discover");

  return (
    <div className="container py-8">
      <header className="mb-7">
        <h1 className="font-display text-4xl tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/feed?category=${encodeURIComponent(cat)}`}
            className={`relative aspect-[5/3] overflow-hidden rounded-2xl bg-gradient-to-br ${
              GRADIENTS[cat] ?? "from-slate-500 to-slate-800"
            } p-4 transition-transform hover:scale-[1.03]`}
          >
            <span className="font-display text-xl leading-tight text-white drop-shadow-sm">
              {cat}
            </span>
            <span className="absolute -bottom-3 -end-2 h-20 w-20 rotate-12 rounded-2xl bg-white/15" />
          </Link>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/feed"
          className="text-sm font-semibold text-primary hover:underline"
        >
          {t("browseAll")} →
        </Link>
      </div>
    </div>
  );
}

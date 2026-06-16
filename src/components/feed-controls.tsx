"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function FeedControls({
  sort,
  category,
}: {
  sort: "hot" | "new";
  category?: string;
}) {
  const t = useTranslations("feed");
  const router = useRouter();
  const pathname = usePathname();

  function update(next: { sort?: string; category?: string }) {
    const params = new URLSearchParams();
    const s = next.sort ?? sort;
    const c = next.category ?? category;
    if (s && s !== "hot") params.set("sort", s);
    if (c) params.set("category", c);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="inline-flex rounded-lg bg-muted p-1">
        {(["hot", "new"] as const).map((s) => (
          <button
            key={s}
            onClick={() => update({ sort: s })}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              sort === s
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s === "hot" ? t("sortHot") : t("sortNew")}
          </button>
        ))}
      </div>

      <Select
        value={category ?? "__all"}
        onValueChange={(v) => update({ category: v === "__all" ? "" : v })}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={t("filterAll")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all">{t("filterAll")}</SelectItem>
          {CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

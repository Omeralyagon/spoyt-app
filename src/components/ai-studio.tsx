"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Sparkles, Clock, Gauge, Save, RefreshCw, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { generateFlowAction, saveGeneratedFlow } from "@/lib/actions";
import { DIFFICULTIES, type Difficulty } from "@/lib/constants";
import type { AiGeneration, GeneratedFlow } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AiStudio({ history }: { history: AiGeneration[] }) {
  const t = useTranslations("ai");
  const td = useTranslations("difficulty");
  const tc = useTranslations("common");
  const locale = useLocale() as "en" | "he";
  const router = useRouter();

  const [classType, setClassType] = useState("Vinyasa Yoga");
  const [duration, setDuration] = useState("45");
  const [level, setLevel] = useState<Difficulty>("beginner");
  const [goals, setGoals] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{
    id: string;
    flow: GeneratedFlow;
  } | null>(null);

  async function generate() {
    if (!classType.trim() || !goals.trim()) return;
    setLoading(true);
    setResult(null);
    const res = await generateFlowAction({
      classType: classType.trim(),
      durationMinutes: Number(duration) || 45,
      level,
      goals: goals.trim(),
      locale,
    });
    setLoading(false);
    if (res.ok) {
      setResult({ id: res.generationId, flow: res.flow });
    } else if (res.error === "auth") {
      router.push("/login");
    } else {
      toast.error(t("error"));
    }
  }

  async function save() {
    if (!result) return;
    setSaving(true);
    const res = await saveGeneratedFlow(result.id, result.flow);
    setSaving(false);
    if (res.ok) {
      toast.success(tc("saved"));
      router.push(`/flow/${res.id}`);
      router.refresh();
    } else {
      toast.error(tc("somethingWrong"));
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      {/* form */}
      <div className="space-y-5">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ct">{t("classType")}</Label>
              <Input
                id="ct"
                value={classType}
                onChange={(e) => setClassType(e.target.value)}
                placeholder={t("classTypePlaceholder")}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dur">{t("duration")}</Label>
                <Input
                  id="dur"
                  type="number"
                  min={5}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("level")}</Label>
                <Select
                  value={level}
                  onValueChange={(v) => setLevel(v as Difficulty)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((d) => (
                      <SelectItem key={d} value={d}>
                        {td(d)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goals">{t("goals")}</Label>
              <Textarea
                id="goals"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder={t("goalsPlaceholder")}
                rows={3}
              />
            </div>
            <Button onClick={generate} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  {t("generating")}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {t("generate")}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* history */}
        {history.length > 0 && (
          <div className="rounded-xl border border-border bg-card/60 p-5">
            <p className="label-mono mb-3 text-muted-foreground">
              {t("historyTitle")}
            </p>
            <ul className="space-y-2">
              {history.slice(0, 6).map((h) => (
                <li
                  key={h.id}
                  className="truncate text-sm text-muted-foreground"
                >
                  · {h.prompt}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* result */}
      <div>
        {loading && <ResultSkeleton />}

        {!loading && !result && (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-10 text-center">
            <Wand2 className="mb-4 h-8 w-8 text-muted-foreground" />
            <p className="font-display text-lg">{t("subtitle")}</p>
          </div>
        )}

        {!loading && result && (
          <div className="rounded-xl border border-border bg-card p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge className="mb-2">{result.flow.category}</Badge>
                <h2 className="font-display text-2xl font-medium leading-tight">
                  {result.flow.title}
                </h2>
              </div>
            </div>
            <p className="mt-3 text-muted-foreground">{result.flow.summary}</p>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {result.flow.duration_minutes} {tc("minutes")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Gauge className="h-4 w-4" />
                {td(result.flow.difficulty)}
              </span>
            </div>

            <ol className="mt-6 space-y-3">
              {result.flow.steps.map((s, i) => (
                <li
                  key={i}
                  className="flex gap-4 rounded-lg border border-border bg-background/50 p-4"
                >
                  <span className="label-mono mt-0.5 text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-medium">{s.title}</h3>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {s.duration_minutes} {tc("minutes")}
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {s.content}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-6 flex gap-2">
              <Button onClick={save} disabled={saving}>
                <Save className="h-4 w-4" />
                {t("saveFlow")}
              </Button>
              <Button variant="outline" onClick={generate} disabled={loading}>
                <RefreshCw className="h-4 w-4" />
                {t("regenerate")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-7">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="mt-3 h-8 w-2/3" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-4/5" />
      <div className="mt-6 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}

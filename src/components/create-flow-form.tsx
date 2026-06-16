"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { createFlow, type CreateFlowInput } from "@/lib/actions";
import { CATEGORIES, DIFFICULTIES, type Difficulty } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Step {
  title: string;
  content: string;
  duration: string;
}

export function CreateFlowForm() {
  const t = useTranslations("create");
  const td = useTranslations("difficulty");
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>("all-levels");
  const [duration, setDuration] = useState("45");
  const [description, setDescription] = useState("");
  const [cover, setCover] = useState("");
  const [youtube, setYoutube] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [steps, setSteps] = useState<Step[]>([
    { title: "", content: "", duration: "" },
  ]);
  const [saving, setSaving] = useState(false);

  function setStep(i: number, patch: Partial<Step>) {
    setSteps((s) => s.map((st, idx) => (idx === i ? { ...st, ...patch } : st)));
  }
  function addStep() {
    setSteps((s) => [...s, { title: "", content: "", duration: "" }]);
  }
  function removeStep(i: number) {
    setSteps((s) => s.filter((_, idx) => idx !== i));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return toast.error(t("errorTitle"));
    const validSteps = steps.filter((s) => s.title.trim());
    if (validSteps.length === 0) return toast.error(t("errorSteps"));

    const input: CreateFlowInput = {
      title: title.trim(),
      category,
      difficulty,
      duration_minutes: Number(duration) || 30,
      description: description.trim(),
      cover_image: cover.trim(),
      youtube_url: youtube.trim(),
      visibility,
      steps: validSteps.map((s) => ({
        title: s.title.trim(),
        content: s.content.trim(),
        duration_minutes: s.duration ? Number(s.duration) : undefined,
      })),
    };

    setSaving(true);
    const res = await createFlow(input);
    setSaving(false);
    if (res.ok) {
      toast.success(t("success"));
      router.push(`/flow/${res.id}`);
      router.refresh();
    } else if (res.error === "auth") {
      router.push("/login");
    } else {
      toast.error(res.error);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="title">{t("fieldTitle")}</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("fieldTitlePlaceholder")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>{t("fieldCategory")}</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t("fieldDifficulty")}</Label>
          <Select
            value={difficulty}
            onValueChange={(v) => setDifficulty(v as Difficulty)}
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
        <div className="space-y-1.5">
          <Label htmlFor="duration">{t("fieldDuration")}</Label>
          <Input
            id="duration"
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="desc">{t("fieldDescription")}</Label>
        <Textarea
          id="desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("fieldDescriptionPlaceholder")}
          rows={3}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="cover">{t("fieldCover")}</Label>
          <Input
            id="cover"
            value={cover}
            onChange={(e) => setCover(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="yt">{t("fieldYoutube")}</Label>
          <Input
            id="yt"
            value={youtube}
            onChange={(e) => setYoutube(e.target.value)}
            placeholder="https://youtube.com/…"
          />
        </div>
      </div>

      {/* steps */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <Label className="text-base">{t("steps")}</Label>
          <Button type="button" variant="outline" size="sm" onClick={addStep}>
            <Plus className="h-4 w-4" />
            {t("addStep")}
          </Button>
        </div>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex gap-3 rounded-lg border border-border bg-card p-3"
            >
              <div className="mt-2 flex flex-col items-center gap-1 text-muted-foreground">
                <GripVertical className="h-4 w-4" />
                <span className="label-mono">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={step.title}
                    onChange={(e) => setStep(i, { title: e.target.value })}
                    placeholder={t("stepTitle")}
                  />
                  <Input
                    type="number"
                    min={0}
                    value={step.duration}
                    onChange={(e) => setStep(i, { duration: e.target.value })}
                    placeholder="min"
                    className="w-24"
                  />
                </div>
                <Textarea
                  value={step.content}
                  onChange={(e) => setStep(i, { content: e.target.value })}
                  placeholder={t("stepContent")}
                  rows={2}
                />
              </div>
              {steps.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeStep(i)}
                  className="text-muted-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-border/70 pt-5">
        <Select
          value={visibility}
          onValueChange={(v) => setVisibility(v as "public" | "private")}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">public</SelectItem>
            <SelectItem value="private">private</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? t("publishing") : t("publish")}
        </Button>
      </div>
    </form>
  );
}

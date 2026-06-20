"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2, GripVertical, Upload, X, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/navigation";
import { createFlow, type CreateFlowInput } from "@/lib/actions";
import { CATEGORIES, DIFFICULTIES, type Difficulty } from "@/lib/constants";
import { isVideo } from "@/lib/utils";
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
  image: string;
  uploading: boolean;
}

export function CreateFlowForm({ userId }: { userId: string }) {
  const t = useTranslations("create");
  const td = useTranslations("difficulty");
  const tc = useTranslations("common");
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>("all-levels");
  const [duration, setDuration] = useState("45");
  const [description, setDescription] = useState("");
  const [cover, setCover] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);
  const [youtube, setYoutube] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [steps, setSteps] = useState<Step[]>([
    { title: "", content: "", duration: "", image: "", uploading: false },
  ]);
  const [saving, setSaving] = useState(false);

  /** Upload a file to the public `covers` bucket and return its URL. */
  async function uploadFile(file: File, folder: string): Promise<string> {
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "bin";
    const path = `${userId}/${folder}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from("covers")
      .upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);
    return supabase.storage.from("covers").getPublicUrl(path).data.publicUrl;
  }

  async function onCoverPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      setCover(await uploadFile(file, "cover"));
    } catch (err) {
      toast.error((err as Error).message || tc("somethingWrong"));
    } finally {
      setCoverUploading(false);
    }
  }

  function setStep(i: number, patch: Partial<Step>) {
    setSteps((s) => s.map((st, idx) => (idx === i ? { ...st, ...patch } : st)));
  }
  function addStep() {
    setSteps((s) => [
      ...s,
      { title: "", content: "", duration: "", image: "", uploading: false },
    ]);
  }
  function removeStep(i: number) {
    setSteps((s) => s.filter((_, idx) => idx !== i));
  }

  async function onStepImage(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStep(i, { uploading: true });
    try {
      const url = await uploadFile(file, "steps");
      setStep(i, { image: url, uploading: false });
    } catch (err) {
      setStep(i, { uploading: false });
      toast.error((err as Error).message || tc("somethingWrong"));
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return toast.error(t("errorTitle"));
    const valid = steps.filter((s) => s.title.trim());
    if (valid.length === 0) return toast.error(t("errorSteps"));

    const input: CreateFlowInput = {
      title: title.trim(),
      category,
      difficulty,
      duration_minutes: Number(duration) || 30,
      description: description.trim(),
      cover_image: cover.trim(),
      youtube_url: youtube.trim(),
      visibility,
      steps: valid.map((s) => ({
        title: s.title.trim(),
        content: s.content.trim(),
        duration_minutes: s.duration ? Number(s.duration) : undefined,
        image_url: s.image || undefined,
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
      {/* cover upload */}
      <div className="space-y-1.5">
        <Label>{t("fieldCover")}</Label>
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-dashed border-border bg-card">
          {cover ? (
            <>
              {isVideo(cover) ? (
                <video
                  src={cover}
                  className="h-full w-full object-cover"
                  muted
                  loop
                  autoPlay
                  playsInline
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt="" className="h-full w-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => setCover("")}
                className="absolute end-2 top-2 rounded-full bg-black/60 p-1.5 text-white backdrop-blur"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground">
              {coverUploading ? (
                <Loader2 className="h-7 w-7 animate-spin" />
              ) : (
                <Upload className="h-7 w-7" />
              )}
              <span className="text-sm">
                {coverUploading ? t("publishing") : `${tc("save")} — image / video`}
              </span>
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={onCoverPick}
                disabled={coverUploading}
              />
            </label>
          )}
        </div>
      </div>

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

      <div className="space-y-1.5">
        <Label htmlFor="yt">{t("fieldYoutube")}</Label>
        <Input
          id="yt"
          value={youtube}
          onChange={(e) => setYoutube(e.target.value)}
          placeholder="https://youtube.com/…"
        />
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
                <span className="label-mono">
                  {String(i + 1).padStart(2, "0")}
                </span>
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
                {/* per-step demo image */}
                <div className="flex items-center gap-3">
                  {step.image ? (
                    <div className="relative h-16 w-16 overflow-hidden rounded-md border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={step.image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setStep(i, { image: "" })}
                        className="absolute end-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground">
                      {step.uploading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ImagePlus className="h-3.5 w-3.5" />
                      )}
                      {t("stepImage")}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => onStepImage(i, e)}
                        disabled={step.uploading}
                      />
                    </label>
                  )}
                </div>
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

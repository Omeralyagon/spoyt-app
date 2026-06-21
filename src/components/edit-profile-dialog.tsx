"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Camera, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/navigation";
import { updateProfile } from "@/lib/actions";
import { initials, isVideo } from "@/lib/utils";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function EditProfileDialog({
  userId,
  fullName,
  bio,
  specialization,
  avatarUrl,
  coverUrl,
}: {
  userId: string;
  fullName: string | null;
  bio: string | null;
  specialization: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
}) {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(fullName ?? "");
  const [bioV, setBioV] = useState(bio ?? "");
  const [spec, setSpec] = useState(specialization ?? "");
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [file, setFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(coverUrl);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function onCoverPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setCoverFile(f);
    setCoverPreview(URL.createObjectURL(f));
  }

  async function upload(bucket: string, f: File, folder: string) {
    const supabase = createClient();
    const ext = f.name.split(".").pop() || "bin";
    const path = `${userId}/${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, f, { upsert: true });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  async function save() {
    setSaving(true);
    try {
      let avatar_url = avatarUrl ?? undefined;
      let cover_url = coverUrl ?? undefined;

      if (file) avatar_url = await upload("avatars", file, "avatar");
      if (coverFile) cover_url = await upload("covers", coverFile, "profile");

      const res = await updateProfile({
        full_name: name.trim() || undefined,
        bio: bioV.trim(),
        specialization: spec.trim(),
        avatar_url,
        cover_url,
      });
      if (!res.ok) throw new Error("save_failed");

      toast.success(tc("saved"));
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message || tc("somethingWrong"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full">
          <Pencil className="h-4 w-4" />
          {t("editProfile")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{t("editProfile")}</DialogTitle>

        <div className="mt-5 space-y-4">
          {/* cover banner (image or video) */}
          <div>
            <Label className="mb-1.5 block">{t("cover")}</Label>
            <label className="relative block aspect-[16/9] w-full cursor-pointer overflow-hidden rounded-xl border border-dashed border-border bg-card">
              {coverPreview ? (
                isVideo(coverPreview) ? (
                  <video
                    src={coverPreview}
                    className="h-full w-full object-cover"
                    muted
                    loop
                    autoPlay
                    playsInline
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverPreview}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )
              ) : (
                <span className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-xs">{t("coverHint")}</span>
                </span>
              )}
              <span className="absolute end-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur">
                <Camera className="h-3.5 w-3.5" />
              </span>
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={onCoverPick}
              />
            </label>
          </div>

          {/* avatar */}
          <div className="flex items-center gap-4">
            <label className="relative cursor-pointer">
              <Avatar className="h-20 w-20 border border-border">
                {preview && <AvatarImage src={preview} alt="" />}
                <AvatarFallback className="text-xl">
                  {initials(name)}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-1 -end-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Camera className="h-3.5 w-3.5" />
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPick}
              />
            </label>
            <span className="text-sm text-muted-foreground">{t("photo")}</span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ep-name">{t("name")}</Label>
            <Input
              id="ep-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ep-spec">{t("specialization")}</Label>
            <Input
              id="ep-spec"
              value={spec}
              onChange={(e) => setSpec(e.target.value)}
              placeholder="Yoga, Pilates, Mobility"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ep-bio">{t("bioField")}</Label>
            <Textarea
              id="ep-bio"
              value={bioV}
              onChange={(e) => setBioV(e.target.value)}
              rows={3}
              maxLength={300}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <DialogClose asChild>
              <Button variant="ghost">{tc("cancel")}</Button>
            </DialogClose>
            <Button onClick={save} disabled={saving}>
              {saving ? t("uploading") : tc("save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

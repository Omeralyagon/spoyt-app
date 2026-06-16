"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function CertUpload({
  profileId,
  userId,
}: {
  profileId: string;
  userId: string;
}) {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const supabase = createClient();
      const path = `${userId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("certifications")
        .upload(path, file);
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage
        .from("certifications")
        .getPublicUrl(path);

      const { error: insErr } = await supabase.from("certifications").insert({
        profile_id: profileId,
        title: file.name,
        file_url: pub.publicUrl,
      } as never);
      if (insErr) throw insErr;

      toast.success(t("certPending"));
      router.refresh();
    } catch {
      toast.error(tc("somethingWrong"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button asChild variant="outline" size="sm" disabled={busy}>
      <label className="cursor-pointer">
        <Upload className="h-4 w-4" />
        {t("uploadCert")}
        <input
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={onFile}
          disabled={busy}
        />
      </label>
    </Button>
  );
}

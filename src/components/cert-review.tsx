"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { reviewCertification } from "@/lib/actions";
import { Button } from "@/components/ui/button";

export function CertReview({ certId }: { certId: string }) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const router = useRouter();
  const [pending, start] = useTransition();

  function review(status: "approved" | "rejected") {
    start(async () => {
      const res = await reviewCertification(certId, status);
      if (res.ok) {
        toast.success(t(status === "approved" ? "approve" : "reject"));
        router.refresh();
      } else {
        toast.error(tc("somethingWrong"));
      }
    });
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={pending} onClick={() => review("approved")}>
        <Check className="h-4 w-4" />
        {t("approve")}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => review("rejected")}
      >
        <X className="h-4 w-4" />
        {t("reject")}
      </Button>
    </div>
  );
}

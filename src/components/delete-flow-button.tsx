"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { deleteFlow } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

export function DeleteFlowButton({ flowId }: { flowId: string }) {
  const t = useTranslations("flow");
  const tc = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function onDelete() {
    start(async () => {
      const res = await deleteFlow(flowId);
      if (res.ok) {
        toast.success(t("deleted"));
        setOpen(false);
        router.push("/library");
        router.refresh();
      } else {
        toast.error(res.error === "auth" ? tc("somethingWrong") : res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive"
          title={t("delete")}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{t("delete")}</DialogTitle>
        <p className="mt-3 text-sm text-muted-foreground">{t("deleteConfirm")}</p>
        <div className="mt-6 flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="ghost">{tc("cancel")}</Button>
          </DialogClose>
          <Button variant="destructive" onClick={onDelete} disabled={pending}>
            <Trash2 className="h-4 w-4" />
            {tc("delete")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Volume2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Accessibility: reads the given text aloud using the browser's built-in
 * speech synthesis (Web Speech API). No external service, works offline,
 * supports Hebrew + English voices.
 */
export function ReadAloud({
  text,
  lang,
}: {
  text: string;
  lang: string;
}) {
  const t = useTranslations("flow");
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window)
        window.speechSynthesis.cancel();
    };
  }, []);

  function toggle() {
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "he" ? "he-IL" : "en-US";
    u.rate = 0.98;
    const voice = synth
      .getVoices()
      .find((v) => v.lang?.toLowerCase().startsWith(lang));
    if (voice) u.voice = voice;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    synth.cancel();
    synth.speak(u);
    setSpeaking(true);
  }

  if (!supported) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggle}
      aria-label={speaking ? t("stopReading") : t("readAloud")}
    >
      {speaking ? (
        <Square className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
      {speaking ? t("stopReading") : t("readAloud")}
    </Button>
  );
}

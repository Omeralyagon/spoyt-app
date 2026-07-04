"use client";

import { shekels } from "../_lib/format";

function ScoreBadge({ label, score, winner }: { label: string; score: number; winner: boolean }) {
  const color = score >= 75 ? "text-emerald-500" : score >= 55 ? "text-amber-500" : "text-rose-500";
  return (
    <div
      className={`flex-1 rounded-2xl border p-4 text-center ${
        winner ? "border-primary bg-primary/5" : "border-border bg-background"
      }`}
    >
      <div className="text-sm font-semibold text-muted-foreground">{label}</div>
      <div className={`mt-1 text-3xl font-black ${color}`}>{score}</div>
      <div className="text-xs text-muted-foreground">מתוך 100</div>
    </div>
  );
}

export function TwoScores({
  aScore,
  bScore,
  recommended,
}: {
  aScore: number;
  bScore: number;
  recommended: "a" | "b";
}) {
  return (
    <div className="flex gap-3">
      <ScoreBadge label="אפשרות א׳" score={aScore} winner={recommended === "a"} />
      <ScoreBadge label="אפשרות ב׳" score={bScore} winner={recommended === "b"} />
    </div>
  );
}

export function SingleScore({ score }: { score: number }) {
  const color = score >= 75 ? "text-emerald-500" : score >= 55 ? "text-amber-500" : "text-rose-500";
  return (
    <div className="text-center">
      <div className={`text-5xl font-black ${color}`}>{score}</div>
      <div className="text-xs text-muted-foreground">ציון התאמה מתוך 100</div>
    </div>
  );
}

export function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

export function money(n: number) {
  return shekels(n);
}

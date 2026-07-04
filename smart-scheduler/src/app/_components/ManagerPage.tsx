"use client";

import { useState } from "react";
import { useScheduler } from "../_lib/store";
import { greeting, hoursColon, shekels } from "../_lib/format";
import { Card, Button, Sheet } from "./ui";
import { DecisionAssistant } from "./DecisionAssistant";
import { OfferAnalyzer } from "./OfferAnalyzer";
import { Sparkles, Scale, ClipboardCheck, Lightbulb } from "lucide-react";

function SummaryStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-xl font-black leading-tight">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

export function ManagerPage() {
  const { state, week, recommendations, dismissRecommendation } = useScheduler();
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [whyRec, setWhyRec] = useState<string | null>(null);

  const hour = new Date().getHours();
  const topRec = recommendations[0] || null;

  return (
    <div className="space-y-5 px-4 pt-6">
      {/* Greeting */}
      <header>
        <h1 className="text-2xl font-black">
          {greeting(hour)}, {state.profile.full_name}
        </h1>
        <p className="text-sm text-muted-foreground">הנה מה שכדאי לדעת על השבוע שלך</p>
      </header>

      {/* Weekly summary */}
      <Card className="p-4">
        <div className="grid grid-cols-4 gap-2">
          <SummaryStat value={`${week.totalClasses}`} label="שיעורים" />
          <SummaryStat value={shekels(week.income)} label="הכנסה" />
          <SummaryStat value={hoursColon(week.teachingMinutes)} label="שעות הוראה" />
          <SummaryStat value={hoursColon(week.travelMinutes)} label="שעות נסיעה" />
        </div>
      </Card>

      {/* Smart recommendation */}
      <Card className="overflow-hidden border-primary/30 bg-gradient-to-b from-primary/[0.08] to-transparent p-5">
        <div className="mb-2 flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5" />
          <span className="font-bold">יש לי הצעה בשבילך</span>
        </div>
        {topRec ? (
          <>
            <p className="text-[15px] font-medium leading-relaxed">{topRec.message}</p>
            <div className="mt-4 flex gap-2">
              <Button className="flex-1" onClick={() => dismissRecommendation(topRec.id)}>
                הבנתי
              </Button>
              <Button variant="ghost" className="flex-1" onClick={() => setWhyRec(topRec.reason)}>
                למה?
              </Button>
            </div>
          </>
        ) : (
          <p className="text-[15px] text-muted-foreground">
            הכול נראה מסודר. אין כרגע המלצות חדשות — הלו״ז שלך יעיל 👌
          </p>
        )}
      </Card>

      {/* Decision assistant */}
      <Card className="p-5" onClick={() => setDecisionOpen(true)}>
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Scale className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="font-bold">יש לי התלבטות</div>
            <div className="text-sm text-muted-foreground">בוא נבדוק איזו אפשרות עדיפה לך</div>
          </div>
        </div>
        <Button className="mt-4 w-full">השווה בין 2 אפשרויות</Button>
      </Card>

      {/* Offer analyzer */}
      <Card className="p-5" onClick={() => setOfferOpen(true)}>
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary/15 text-secondary">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="font-bold">בדיקת הצעת שיעור</div>
            <div className="text-sm text-muted-foreground">קיבלת הצעה? בדוק אם היא באמת משתלמת</div>
          </div>
        </div>
      </Card>

      <DecisionAssistant open={decisionOpen} onClose={() => setDecisionOpen(false)} />
      <OfferAnalyzer open={offerOpen} onClose={() => setOfferOpen(false)} />

      <Sheet open={!!whyRec} onClose={() => setWhyRec(null)} title="למה?">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <Lightbulb className="h-5 w-5" />
          </div>
          <p className="text-[15px] leading-relaxed">{whyRec}</p>
        </div>
      </Sheet>
    </div>
  );
}

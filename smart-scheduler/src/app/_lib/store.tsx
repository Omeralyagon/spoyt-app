"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  ClassSession,
  ClassOffer,
  DecisionComparison,
  SchedulerState,
  Studio,
  UserProfile,
} from "./types";
import { demoState } from "./demo";
import { analyzeWeek, type WeekAnalysis } from "./engine";
import { generateRecommendations } from "./recommendations";
import type { Recommendation } from "./types";

const STORAGE_KEY = "spoyt.scheduler.v1";

interface StoreValue {
  state: SchedulerState;
  week: WeekAnalysis;
  recommendations: Recommendation[];
  ready: boolean;
  addClass: (c: Omit<ClassSession, "id">) => ClassSession;
  updateClass: (c: ClassSession) => void;
  deleteClass: (id: string) => void;
  addStudio: (s: Omit<Studio, "id">) => Studio;
  updateProfile: (p: Partial<UserProfile>) => void;
  dismissRecommendation: (id: string) => void;
  saveOffer: (o: Omit<ClassOffer, "id" | "created_date">) => void;
  saveDecision: (d: Omit<DecisionComparison, "id" | "created_date">) => void;
  resetDemo: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function loadState(): SchedulerState {
  if (typeof window === "undefined") return demoState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return demoState();
    const parsed = JSON.parse(raw) as SchedulerState;
    // minimal shape guard
    if (!parsed.profile || !Array.isArray(parsed.classes)) return demoState();
    return {
      ...parsed,
      offers: parsed.offers ?? [],
      decisions: parsed.decisions ?? [],
      dismissedRecommendations: parsed.dismissedRecommendations ?? [],
    };
  } catch {
    return demoState();
  }
}

let idCounter = 0;
function makeId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}

export function SchedulerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SchedulerState>(demoState);
  const [ready, setReady] = useState(false);

  // Hydrate from localStorage on the client only (avoids SSR mismatch).
  useEffect(() => {
    setState(loadState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, ready]);

  const week = useMemo(
    () => analyzeWeek(state.classes, state.studios, state.profile),
    [state.classes, state.studios, state.profile]
  );

  const recommendations = useMemo(() => {
    const all = generateRecommendations(week);
    const dismissed = new Set(state.dismissedRecommendations);
    return all.filter((r) => !dismissed.has(r.id));
  }, [week, state.dismissedRecommendations]);

  const value: StoreValue = {
    state,
    week,
    recommendations,
    ready,
    addClass: (c) => {
      const created: ClassSession = { ...c, id: makeId("c") };
      setState((s) => ({ ...s, classes: [...s.classes, created] }));
      return created;
    },
    updateClass: (c) =>
      setState((s) => ({
        ...s,
        classes: s.classes.map((x) => (x.id === c.id ? c : x)),
      })),
    deleteClass: (id) =>
      setState((s) => ({ ...s, classes: s.classes.filter((x) => x.id !== id) })),
    addStudio: (st) => {
      const created: Studio = { ...st, id: makeId("st") };
      setState((s) => ({ ...s, studios: [...s.studios, created] }));
      return created;
    },
    updateProfile: (p) =>
      setState((s) => ({ ...s, profile: { ...s.profile, ...p } })),
    dismissRecommendation: (id) =>
      setState((s) => ({
        ...s,
        dismissedRecommendations: [...s.dismissedRecommendations, id],
      })),
    saveOffer: (o) =>
      setState((s) => ({
        ...s,
        offers: [
          ...s.offers,
          { ...o, id: makeId("of"), created_date: new Date().toISOString() },
        ],
      })),
    saveDecision: (d) =>
      setState((s) => ({
        ...s,
        decisions: [
          ...s.decisions,
          { ...d, id: makeId("dc"), created_date: new Date().toISOString() },
        ],
      })),
    resetDemo: () => setState(demoState()),
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useScheduler(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useScheduler must be used within SchedulerProvider");
  return ctx;
}

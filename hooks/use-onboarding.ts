"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface OnboardingState {
  onboardingStartedAt: string | null;
  onboardingCompletedAt: string | null;
  onboardingDismissedAt: string | null;
  onboardingNeverShowAgain: boolean;
  onboardingLastStep: number;
}

const EMPTY_STATE: OnboardingState = {
  onboardingStartedAt: null,
  onboardingCompletedAt: null,
  onboardingDismissedAt: null,
  onboardingNeverShowAgain: false,
  onboardingLastStep: 1,
};

const STORAGE_KEY = "aot-onboarding";

function readLocal(): OnboardingState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OnboardingState) : null;
  } catch {
    return null;
  }
}

function writeLocal(state: OnboardingState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

async function patchState(patch: Partial<OnboardingState>) {
  try {
    const res = await fetch("/api/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
      cache: "no-store",
    });
    if (res.ok) return (await res.json()) as OnboardingState;
  } catch {
    /* offline — keep local */
  }
  return null;
}

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>(() => readLocal() ?? EMPTY_STATE);
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<"welcome" | "tour" | null>(null);
  const [stepIndex, setStepIndex] = useState(1);
  const hasShownRef = useRef(false);

  // Load server state on mount.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/onboarding", { cache: "no-store" });
        if (!res.ok) return;
        const server = (await res.json()) as OnboardingState;
        if (cancelled) return;
        setState((prev) => ({ ...prev, ...server }));
        writeLocal({ ...(readLocal() ?? EMPTY_STATE), ...server });
      } catch {
        /* offline */
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Show the welcome modal for anyone with INCOMPLETE onboarding — a brand-new
  // user, a user who started the tour but never finished it, or a second user
  // from an existing tenant whose personal onboarding is not done. Only users
  // who completed onboarding, explicitly dismissed it, or opted out are left
  // alone. Deferred (async) so it never sets state synchronously in the effect.
  useEffect(() => {
    if (!loaded || hasShownRef.current) return;
    const dismissed = !!state.onboardingDismissedAt;
    const completed = !!state.onboardingCompletedAt;
    if (!state.onboardingNeverShowAgain && !completed && !dismissed) {
      hasShownRef.current = true;
      const timer = window.setTimeout(() => {
        setMode("welcome");
        setStepIndex(1);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [loaded, state]);

  const startTour = useCallback(async () => {
    setMode("tour");
    setStepIndex(1);
    const next = { ...state, onboardingStartedAt: new Date().toISOString(), onboardingLastStep: 1 };
    setState(next);
    writeLocal(next);
    await patchState({ onboardingStartedAt: next.onboardingStartedAt, onboardingLastStep: 1 });
  }, [state]);

  const skip = useCallback(async () => {
    setMode(null);
    const next = {
      ...state,
      onboardingStartedAt: state.onboardingStartedAt ?? new Date().toISOString(),
      onboardingDismissedAt: new Date().toISOString(),
    };
    setState(next);
    writeLocal(next);
    await patchState({
      onboardingStartedAt: next.onboardingStartedAt,
      onboardingDismissedAt: next.onboardingDismissedAt,
    });
  }, [state]);

  const neverShowAgain = useCallback(async () => {
    setMode(null);
    const next = {
      ...state,
      onboardingNeverShowAgain: true,
      onboardingDismissedAt: new Date().toISOString(),
    };
    setState(next);
    writeLocal(next);
    await patchState({
      onboardingNeverShowAgain: true,
      onboardingDismissedAt: next.onboardingDismissedAt,
    });
  }, [state]);

  const complete = useCallback(async () => {
    setMode(null);
    const next = {
      ...state,
      onboardingCompletedAt: new Date().toISOString(),
      onboardingLastStep: 1,
    };
    setState(next);
    writeLocal(next);
    await patchState({
      onboardingCompletedAt: next.onboardingCompletedAt,
      onboardingLastStep: 1,
    });
  }, [state]);

  const handleStepChange = useCallback(async (index: number) => {
    setStepIndex(index);
    const next = { ...state, onboardingLastStep: index };
    setState(next);
    writeLocal(next);
    // Persist progress (fire-and-forget, no await to keep the tour snappy).
    void patchState({ onboardingLastStep: index });
  }, [state]);

  const restart = useCallback(() => {
    setMode("tour");
    setStepIndex(1);
    const next = { ...state, onboardingStartedAt: new Date().toISOString(), onboardingLastStep: 1 };
    setState(next);
    writeLocal(next);
    void patchState({ onboardingStartedAt: next.onboardingStartedAt, onboardingLastStep: 1 });
  }, [state]);

  return {
    loaded,
    mode,
    stepIndex,
    startTour,
    skip,
    neverShowAgain,
    complete,
    handleStepChange,
    restart,
  };
}

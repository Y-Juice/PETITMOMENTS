import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  readOnboardingCompleted,
  writeOnboardingCompleted,
} from '@/utils/onboarding-storage';

type OnboardingContextValue = {
  hasCompletedOnboarding: boolean;
  loading: boolean;
  completeOnboarding: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(
  undefined,
);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const completed = await readOnboardingCompleted();
      if (cancelled) return;
      setHasCompletedOnboarding(completed);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const completeOnboarding = useCallback(async () => {
    await writeOnboardingCompleted();
    setHasCompletedOnboarding(true);
  }, []);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      hasCompletedOnboarding,
      loading,
      completeOnboarding,
    }),
    [hasCompletedOnboarding, loading, completeOnboarding],
  );

  return (
    <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used inside OnboardingProvider');
  }
  return ctx;
}

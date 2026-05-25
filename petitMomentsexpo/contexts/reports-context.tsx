import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '@/contexts/auth-context';
import type { ReportReason, ReportTargetType } from '@/data/moderation';
import {
  fetchMyReportedContentKeys,
  submitContentReport,
  toReportKey,
} from '@/utils/reports-supabase';

type ReportsContextValue = {
  loading: boolean;
  loadError: string | null;
  hasReported: (targetType: ReportTargetType, targetId: string) => boolean;
  reportContent: (
    targetType: ReportTargetType,
    targetId: string,
    reason: ReportReason,
    details?: string,
  ) => Promise<{ error: string | null }>;
  refreshReports: () => Promise<void>;
};

const ReportsContext = createContext<ReportsContextValue | undefined>(undefined);

export function ReportsProvider({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const [reportedKeys, setReportedKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshReports = useCallback(async () => {
    if (!session?.user?.id) {
      setReportedKeys(new Set());
      setLoading(false);
      setLoadError(null);
      return;
    }

    setLoading(true);
    setLoadError(null);

    const { keys, error } = await fetchMyReportedContentKeys();
    setReportedKeys(new Set(keys));
    setLoadError(error);
    setLoading(false);
  }, [session?.user?.id]);

  useEffect(() => {
    if (authLoading) return;
    void refreshReports();
  }, [authLoading, refreshReports]);

  const hasReported = useCallback(
    (targetType: ReportTargetType, targetId: string) =>
      reportedKeys.has(toReportKey(targetType, targetId)),
    [reportedKeys],
  );

  const reportContent = useCallback(
    async (
      targetType: ReportTargetType,
      targetId: string,
      reason: ReportReason,
      details?: string,
    ) => {
      const key = toReportKey(targetType, targetId);
      if (reportedKeys.has(key)) {
        return { error: 'Je hebt dit item al gerapporteerd.' };
      }

      const previous = reportedKeys;
      setReportedKeys((current) => new Set(current).add(key));

      const { error } = await submitContentReport({
        targetType,
        targetId,
        reason,
        details,
      });

      if (error) {
        setReportedKeys(previous);
        return { error };
      }

      return { error: null };
    },
    [reportedKeys],
  );

  const value = useMemo<ReportsContextValue>(
    () => ({
      loading,
      loadError,
      hasReported,
      reportContent,
      refreshReports,
    }),
    [loading, loadError, hasReported, reportContent, refreshReports],
  );

  return (
    <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>
  );
}

export function useReports() {
  const ctx = useContext(ReportsContext);
  if (!ctx) {
    throw new Error('useReports must be used inside ReportsProvider');
  }
  return ctx;
}

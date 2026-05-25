import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '@/contexts/auth-context';
import type { ModerationStatus, ReportStatus } from '@/data/moderation';
import {
  dismissReport,
  fetchAdminReports,
  fetchIsAdmin,
  markReportReviewed,
  resolveReportWithAction,
  type AdminReport,
} from '@/utils/admin-supabase';

type AdminContextValue = {
  isAdmin: boolean;
  loading: boolean;
  loadError: string | null;
  reports: AdminReport[];
  reportsLoading: boolean;
  reportsError: string | null;
  statusFilter: ReportStatus | 'all';
  setStatusFilter: (filter: ReportStatus | 'all') => void;
  refreshAdminAccess: () => Promise<void>;
  refreshReports: () => Promise<void>;
  dismiss: (reportId: string) => Promise<{ error: string | null }>;
  markReviewed: (reportId: string) => Promise<{ error: string | null }>;
  takeAction: (
    report: AdminReport,
    moderationStatus: ModerationStatus,
  ) => Promise<{ error: string | null }>;
};

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('pending');

  const refreshAdminAccess = useCallback(async () => {
    if (!session?.user?.id) {
      setIsAdmin(false);
      setLoading(false);
      setLoadError(null);
      return;
    }

    setLoading(true);
    setLoadError(null);
    const { isAdmin: nextIsAdmin, error } = await fetchIsAdmin();
    setIsAdmin(nextIsAdmin);
    setLoadError(error);
    setLoading(false);
  }, [session?.user?.id]);

  const refreshReports = useCallback(async () => {
    if (!isAdmin) {
      setReports([]);
      setReportsError(null);
      return;
    }

    setReportsLoading(true);
    setReportsError(null);
    const { reports: nextReports, error } = await fetchAdminReports(statusFilter);
    setReports(nextReports);
    setReportsError(error);
    setReportsLoading(false);
  }, [isAdmin, statusFilter]);

  useEffect(() => {
    if (authLoading) return;
    void refreshAdminAccess();
  }, [authLoading, refreshAdminAccess]);

  useEffect(() => {
    if (!isAdmin) return;
    void refreshReports();
  }, [isAdmin, refreshReports]);

  const dismiss = useCallback(async (reportId: string) => {
    const { error } = await dismissReport(reportId);
    if (!error) await refreshReports();
    return { error };
  }, [refreshReports]);

  const markReviewed = useCallback(async (reportId: string) => {
    const { error } = await markReportReviewed(reportId);
    if (!error) await refreshReports();
    return { error };
  }, [refreshReports]);

  const takeAction = useCallback(
    async (report: AdminReport, moderationStatus: ModerationStatus) => {
      const { error } = await resolveReportWithAction(report, moderationStatus);
      if (!error) await refreshReports();
      return { error };
    },
    [refreshReports],
  );

  const value = useMemo<AdminContextValue>(
    () => ({
      isAdmin,
      loading,
      loadError,
      reports,
      reportsLoading,
      reportsError,
      statusFilter,
      setStatusFilter,
      refreshAdminAccess,
      refreshReports,
      dismiss,
      markReviewed,
      takeAction,
    }),
    [
      isAdmin,
      loading,
      loadError,
      reports,
      reportsLoading,
      reportsError,
      statusFilter,
      refreshAdminAccess,
      refreshReports,
      dismiss,
      markReviewed,
      takeAction,
    ],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error('useAdmin must be used inside AdminProvider');
  }
  return ctx;
}

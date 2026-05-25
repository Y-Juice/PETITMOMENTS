import Constants from 'expo-constants';

import type {
  ContentWarningLabel,
  ModerationStatus,
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from '@/data/moderation';
import { reasonToContentWarning } from '@/data/moderation';
import { supabase } from '@/utils/supabase';

type SimpleResult = {
  error: string | null;
};

export type AdminReport = {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  createdAt: string;
  targetTitle: string;
  targetModerationStatus: ModerationStatus;
};

type FetchAdminReportsResult = {
  reports: AdminReport[];
  error: string | null;
};

type FetchIsAdminResult = {
  isAdmin: boolean;
  error: string | null;
};

const REPORT_STATUSES: ReportStatus[] = [
  'pending',
  'reviewed',
  'dismissed',
  'action_taken',
];

const REPORT_REASONS: ReportReason[] = [
  'spam',
  'harassment',
  'hate',
  'violence',
  'nudity',
  'misinformation',
  'other',
];

function explainError(code: string | undefined, table: string): string | null {
  if (code === '42P01') {
    return `De tabel '${table}' bestaat nog niet. Voer eerst de SQL migratie uit.`;
  }
  if (code === '42501') {
    return `RLS blokkeert deze actie op '${table}'. Controleer admin policies.`;
  }
  return null;
}

function getAdminEmailsFromEnv(): string[] {
  const raw =
    process.env.EXPO_PUBLIC_ADMIN_EMAILS ??
    (Constants.expoConfig?.extra?.adminEmails as string | undefined) ??
    '';
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function getUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id) return null;
  return data.user.id;
}

function parseReportStatus(raw: unknown): ReportStatus {
  const value = String(raw ?? 'pending').trim() as ReportStatus;
  return REPORT_STATUSES.includes(value) ? value : 'pending';
}

function parseReportReason(raw: unknown): ReportReason {
  const value = String(raw ?? 'other').trim() as ReportReason;
  return REPORT_REASONS.includes(value) ? value : 'other';
}

function parseTargetType(raw: unknown): ReportTargetType | null {
  const value = String(raw ?? '').trim();
  if (value === 'moment' || value === 'thread') return value;
  return null;
}

function parseModerationStatus(raw: unknown): ModerationStatus {
  const value = String(raw ?? 'visible').trim() as ModerationStatus;
  if (value === 'warned' || value === 'hidden' || value === 'removed') return value;
  return 'visible';
}

function rowToAdminReport(
  row: Record<string, unknown>,
  targetTitle: string,
  targetModerationStatus: ModerationStatus,
): AdminReport | null {
  const targetType = parseTargetType(row.target_type);
  const targetId = String(row.target_id ?? '').trim();
  if (!targetType || !targetId) return null;

  return {
    id: String(row.id ?? ''),
    reporterId: String(row.reporter_id ?? ''),
    targetType,
    targetId,
    reason: parseReportReason(row.reason),
    details: row.details == null ? null : String(row.details),
    status: parseReportStatus(row.status),
    createdAt: String(row.created_at ?? ''),
    targetTitle,
    targetModerationStatus,
  };
}

async function fetchTargetMeta(
  targetType: ReportTargetType,
  targetId: string,
): Promise<{ title: string; moderationStatus: ModerationStatus }> {
  const table = targetType === 'moment' ? 'moments' : 'threads';
  const selectVariants =
    targetType === 'moment'
      ? ['id, caption, address, moderation_status', 'id, caption, moderation_status']
      : ['id, title, description, moderation_status', 'id, title, moderation_status'];

  for (const columns of selectVariants) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .eq('id', targetId)
      .maybeSingle();

    if (error) continue;

    const row = (data ?? {}) as Record<string, unknown>;
    if (targetType === 'moment') {
      const caption = String(row.caption ?? '').trim();
      const address = String(row.address ?? '').trim();
      return {
        title: caption || address || 'Moment',
        moderationStatus: parseModerationStatus(row.moderation_status),
      };
    }

    const title = String(row.title ?? row.description ?? '').trim();
    return {
      title: title || 'Discussie',
      moderationStatus: parseModerationStatus(row.moderation_status),
    };
  }

  return { title: `${targetType} ${targetId.slice(0, 8)}`, moderationStatus: 'visible' };
}

export async function fetchIsAdmin(): Promise<FetchIsAdminResult> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user?.id) {
    return { isAdmin: false, error: null };
  }

  const email = userData.user.email?.trim().toLowerCase() ?? '';
  const envAdmins = getAdminEmailsFromEnv();
  if (email && envAdmins.includes(email)) {
    return { isAdmin: true, error: null };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (error) {
    const hint = (error.message ?? '').toLowerCase();
    if (hint.includes('does not exist') || hint.includes('column')) {
      return { isAdmin: false, error: null };
    }
    return { isAdmin: false, error: error.message };
  }

  return { isAdmin: Boolean(data?.is_admin), error: null };
}

export async function fetchAdminReports(
  statusFilter: ReportStatus | 'all' = 'all',
): Promise<FetchAdminReportsResult> {
  let query = supabase
    .from('content_reports')
    .select('id, reporter_id, target_type, target_id, reason, details, status, created_at')
    .order('created_at', { ascending: false });

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    const friendly = explainError(error.code, 'content_reports');
    return { reports: [], error: friendly ?? error.message };
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  const metaCache = new Map<
    string,
    { title: string; moderationStatus: ModerationStatus }
  >();

  const reports: AdminReport[] = [];

  for (const row of rows) {
    const targetType = parseTargetType(row.target_type);
    const targetId = String(row.target_id ?? '').trim();
    if (!targetType || !targetId) continue;

    const cacheKey = `${targetType}:${targetId}`;
    let meta = metaCache.get(cacheKey);
    if (!meta) {
      meta = await fetchTargetMeta(targetType, targetId);
      metaCache.set(cacheKey, meta);
    }

    const parsed = rowToAdminReport(row, meta.title, meta.moderationStatus);
    if (parsed) reports.push(parsed);
  }

  return { reports, error: null };
}

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
): Promise<SimpleResult> {
  const { error } = await supabase
    .from('content_reports')
    .update({ status })
    .eq('id', reportId);

  if (error) {
    const friendly = explainError(error.code, 'content_reports');
    return { error: friendly ?? error.message };
  }

  return { error: null };
}

export async function applyModerationToTarget(
  targetType: ReportTargetType,
  targetId: string,
  moderationStatus: ModerationStatus,
  contentWarning?: ContentWarningLabel[],
): Promise<SimpleResult> {
  const table = targetType === 'moment' ? 'moments' : 'threads';
  const patch: Record<string, unknown> = { moderation_status: moderationStatus };

  if (contentWarning?.length) {
    patch.content_warning = contentWarning;
  }

  const { error } = await supabase.from(table).update(patch).eq('id', targetId);

  if (error) {
    const friendly = explainError(error.code, table);
    return { error: friendly ?? error.message };
  }

  return { error: null };
}

export async function resolveReportWithAction(
  report: AdminReport,
  moderationStatus: ModerationStatus,
): Promise<SimpleResult> {
  const contentWarning =
    moderationStatus === 'warned'
      ? [reasonToContentWarning(report.reason)]
      : moderationStatus === 'visible'
        ? []
        : [reasonToContentWarning(report.reason)];

  const moderationError = await applyModerationToTarget(
    report.targetType,
    report.targetId,
    moderationStatus,
    contentWarning,
  );
  if (moderationError.error) return moderationError;

  return updateReportStatus(report.id, 'action_taken');
}

export async function dismissReport(reportId: string): Promise<SimpleResult> {
  return updateReportStatus(reportId, 'dismissed');
}

export async function markReportReviewed(reportId: string): Promise<SimpleResult> {
  return updateReportStatus(reportId, 'reviewed');
}

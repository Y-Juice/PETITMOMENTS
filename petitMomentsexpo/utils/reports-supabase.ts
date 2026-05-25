import type { ReportReason, ReportTargetType } from '@/data/moderation';
import { supabase } from '@/utils/supabase';

type SimpleResult = {
  error: string | null;
};

type FetchReportedKeysResult = {
  keys: string[];
  error: string | null;
};

export type SubmitReportInput = {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
};

function explainError(code: string | undefined, table: string): string | null {
  if (code === '42P01') {
    return `De tabel '${table}' bestaat nog niet. Voer eerst de SQL migratie uit.`;
  }
  if (code === '42501') {
    return `RLS blokkeert deze actie op '${table}'. Controleer de policies.`;
  }
  if (code === '23505') {
    return 'Je hebt dit item al gerapporteerd.';
  }
  return null;
}

async function getUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id) return null;
  return data.user.id;
}

function toReportKey(targetType: ReportTargetType, targetId: string): string {
  return `${targetType}:${targetId}`;
}

export async function fetchMyReportedContentKeys(): Promise<FetchReportedKeysResult> {
  const userId = await getUserId();
  if (!userId) return { keys: [], error: null };

  const { data, error } = await supabase
    .from('content_reports')
    .select('target_type, target_id')
    .eq('reporter_id', userId);

  if (error) {
    const friendly = explainError(error.code, 'content_reports');
    return { keys: [], error: friendly ?? error.message };
  }

  const keys = (data ?? [])
    .map((row) => {
      const targetType = String(
        (row as { target_type?: unknown }).target_type ?? '',
      ).trim() as ReportTargetType;
      const targetId = String(
        (row as { target_id?: unknown }).target_id ?? '',
      ).trim();
      if (targetType !== 'moment' && targetType !== 'thread') return '';
      if (!targetId) return '';
      return toReportKey(targetType, targetId);
    })
    .filter(Boolean);

  return { keys, error: null };
}

export async function submitContentReport(
  input: SubmitReportInput,
): Promise<SimpleResult> {
  const userId = await getUserId();
  if (!userId) return { error: 'Je bent niet (meer) ingelogd.' };

  const details = input.details?.trim() ?? '';
  const payloads: Record<string, unknown>[] = [
    {
      reporter_id: userId,
      target_type: input.targetType,
      target_id: input.targetId,
      reason: input.reason,
      details: details || null,
      status: 'pending',
    },
    {
      reporter_id: userId,
      target_type: input.targetType,
      target_id: input.targetId,
      reason: input.reason,
      details: details || null,
    },
  ];

  let lastMessage = '';

  for (const payload of payloads) {
    const { error } = await supabase.from('content_reports').insert(payload);
    if (!error) return { error: null };

    lastMessage = error.message ?? 'Kon melding niet opslaan.';
    const friendly = explainError(error.code, 'content_reports');
    if (friendly) return { error: friendly };

    const hint = lastMessage.toLowerCase();
    const maybeWrongColumn =
      hint.includes('does not exist') ||
      hint.includes('column') ||
      hint.includes('schema cache');

    if (!maybeWrongColumn) break;
  }

  return { error: lastMessage || 'Kon melding niet opslaan.' };
}

export { toReportKey };

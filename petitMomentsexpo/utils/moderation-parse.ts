import type {
  ContentWarningLabel,
  ModerationStatus,
} from '@/data/moderation';

const WARNING_LABELS: ContentWarningLabel[] = [
  'sensitive',
  'violence',
  'nudity',
  'disturbing',
  'other',
];

const MODERATION_STATUSES: ModerationStatus[] = [
  'visible',
  'warned',
  'hidden',
  'removed',
];

export function parseContentWarnings(raw: unknown): ContentWarningLabel[] | undefined {
  if (raw == null) return undefined;

  let values: unknown[] = [];
  if (Array.isArray(raw)) {
    values = raw;
  } else if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (Array.isArray(parsed)) values = parsed;
      } catch {
        values = trimmed.split(',').map((part) => part.trim());
      }
    } else {
      values = trimmed.split(',').map((part) => part.trim());
    }
  }

  const labels = values
    .map((value) => String(value).trim().toLowerCase())
    .filter((value): value is ContentWarningLabel =>
      WARNING_LABELS.includes(value as ContentWarningLabel),
    );

  return labels.length ? labels : undefined;
}

export function parseModerationStatus(raw: unknown): ModerationStatus | undefined {
  if (typeof raw !== 'string') return undefined;
  const value = raw.trim().toLowerCase() as ModerationStatus;
  return MODERATION_STATUSES.includes(value) ? value : undefined;
}

export type ContentWarningLabel =
  | 'sensitive'
  | 'violence'
  | 'nudity'
  | 'disturbing'
  | 'other';

export type ModerationStatus = 'visible' | 'warned' | 'hidden' | 'removed';

export type ReportTargetType = 'moment' | 'thread';

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'hate'
  | 'violence'
  | 'nudity'
  | 'misinformation'
  | 'other';

export type ReportStatus = 'pending' | 'reviewed' | 'dismissed' | 'action_taken';

export const CONTENT_WARNING_LABELS: Record<ContentWarningLabel, string> = {
  sensitive: 'Gevoelige inhoud',
  violence: 'Geweld',
  nudity: 'Naaktbeelden',
  disturbing: 'Beklemmende inhoud',
  other: 'Andere waarschuwing',
};

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: 'Spam',
  harassment: 'Intimidatie of pesten',
  hate: 'Haatzaaien',
  violence: 'Geweld of bedreiging',
  nudity: 'Ongepaste naaktbeelden',
  misinformation: 'Misleidende informatie',
  other: 'Anders',
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  pending: 'Open',
  reviewed: 'Bekeken',
  dismissed: 'Afgewezen',
  action_taken: 'Actie ondernomen',
};

export const MODERATION_STATUS_LABELS: Record<ModerationStatus, string> = {
  visible: 'Zichtbaar',
  warned: 'Waarschuwing',
  hidden: 'Verborgen',
  removed: 'Verwijderd',
};

export type ModeratedContent = {
  contentWarning?: ContentWarningLabel[];
  moderationStatus?: ModerationStatus;
};

export function hasContentWarning(item: ModeratedContent): boolean {
  if ((item.contentWarning?.length ?? 0) > 0) return true;
  return item.moderationStatus === 'warned';
}

export function formatContentWarningLabels(labels: ContentWarningLabel[]): string {
  if (labels.length === 0) return CONTENT_WARNING_LABELS.sensitive;
  return labels.map((label) => CONTENT_WARNING_LABELS[label]).join(' · ');
}

export function isContentHiddenFromViewer(
  item: ModeratedContent & { ownerId?: string | null },
  viewerId: string | null,
): boolean {
  if (item.moderationStatus !== 'hidden' && item.moderationStatus !== 'removed') {
    return false;
  }
  if (!viewerId || !item.ownerId) return true;
  return item.ownerId !== viewerId;
}

export function reasonToContentWarning(reason: ReportReason): ContentWarningLabel {
  switch (reason) {
    case 'violence':
      return 'violence';
    case 'nudity':
      return 'nudity';
    case 'harassment':
    case 'hate':
      return 'disturbing';
    default:
      return 'sensitive';
  }
}

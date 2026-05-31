import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Brand } from '@/constants/theme';
import { FontFamily } from '@/constants/typography';
import { useAdmin } from '@/contexts/admin-context';
import { useMoments } from '@/contexts/moments-context';
import { useThreads } from '@/contexts/threads-context';
import {
  MODERATION_STATUS_LABELS,
  REPORT_REASON_LABELS,
  REPORT_STATUS_LABELS,
} from '@/data/moderation';
import type { AdminReport } from '@/utils/admin-supabase';
import { useThemeColor } from '@/hooks/use-theme-color';

type AdminReportRowProps = {
  report: AdminReport;
};

function formatDate(iso: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('nl-BE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminReportRow({ report }: AdminReportRowProps) {
  const { dismiss, markReviewed, takeAction } = useAdmin();
  const { refreshMoments } = useMoments();
  const { refreshThreads } = useThreads();
  const [busy, setBusy] = useState(false);
  const textColor = useThemeColor({}, 'text');
  const muted = useThemeColor({}, 'icon');
  const cardBg = useThemeColor(
    { light: '#FFFFFF', dark: '#171717' },
    'background',
  );
  const borderColor = useThemeColor(
    { light: '#E2E2E2', dark: '#343434' },
    'text',
  );

  const runAction = async (action: () => Promise<{ error: string | null }>) => {
    if (busy) return;
    setBusy(true);
    const { error } = await action();
    setBusy(false);
    if (error) {
      Alert.alert('Actie mislukt', error);
      return;
    }
    refreshMoments();
    void refreshThreads();
  };

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
      <View style={styles.headerRow}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>
            {report.targetType === 'moment' ? 'Moment' : 'Rode draad'}
          </Text>
        </View>
        <View style={[styles.statusBadge, statusStyle(report.status)]}>
          <Text style={styles.statusBadgeText}>
            {REPORT_STATUS_LABELS[report.status]}
          </Text>
        </View>
      </View>

      <Text style={[styles.title, { color: textColor }]} numberOfLines={2}>
        {report.targetTitle}
      </Text>

      <Text style={[styles.meta, { color: muted }]}>
        Reden: {REPORT_REASON_LABELS[report.reason]}
      </Text>
      <Text style={[styles.meta, { color: muted }]}>
        Inhoud nu: {MODERATION_STATUS_LABELS[report.targetModerationStatus]}
      </Text>
      <Text style={[styles.meta, { color: muted }]}>
        Gemeld op {formatDate(report.createdAt)}
      </Text>

      {report.details ? (
        <Text style={[styles.details, { color: textColor }]} numberOfLines={4}>
          "{report.details}"
        </Text>
      ) : null}

      <View style={styles.actionsWrap}>
        <Pressable
          disabled={busy || report.status !== 'pending'}
          onPress={() =>
            void runAction(() => markReviewed(report.id))
          }
          style={({ pressed }) => [
            styles.actionBtn,
            { borderColor },
            pressed && styles.pressed,
            (busy || report.status !== 'pending') && styles.disabled,
          ]}>
          <Text style={[styles.actionText, { color: textColor }]}>Bekeken</Text>
        </Pressable>

        <Pressable
          disabled={busy || report.status !== 'pending'}
          onPress={() => void runAction(() => dismiss(report.id))}
          style={({ pressed }) => [
            styles.actionBtn,
            { borderColor },
            pressed && styles.pressed,
            (busy || report.status !== 'pending') && styles.disabled,
          ]}>
          <Text style={[styles.actionText, { color: textColor }]}>Afwijzen</Text>
        </Pressable>
      </View>

      <View style={styles.actionsWrap}>
        <Pressable
          disabled={busy}
          onPress={() =>
            void runAction(() => takeAction(report, 'warned'))
          }
          style={({ pressed }) => [
            styles.actionBtn,
            styles.warnBtn,
            pressed && styles.pressed,
            busy && styles.disabled,
          ]}>
          {busy ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.actionTextLight}>Waarschuwing</Text>
          )}
        </Pressable>

        <Pressable
          disabled={busy}
          onPress={() =>
            void runAction(() => takeAction(report, 'hidden'))
          }
          style={({ pressed }) => [
            styles.actionBtn,
            styles.hideBtn,
            pressed && styles.pressed,
            busy && styles.disabled,
          ]}>
          <Text style={styles.actionTextLight}>Verbergen</Text>
        </Pressable>

        <Pressable
          disabled={busy}
          onPress={() =>
            Alert.alert(
              'Inhoud verwijderen',
              'Markeer deze inhoud als verwijderd voor alle gebruikers?',
              [
                { text: 'Annuleren', style: 'cancel' },
                {
                  text: 'Verwijderen',
                  style: 'destructive',
                  onPress: () =>
                    void runAction(() => takeAction(report, 'removed')),
                },
              ],
            )
          }
          style={({ pressed }) => [
            styles.actionBtn,
            styles.removeBtn,
            pressed && styles.pressed,
            busy && styles.disabled,
          ]}>
          <MaterialIcons name="delete-outline" size={16} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

function statusStyle(status: AdminReport['status']) {
  switch (status) {
    case 'pending':
      return { backgroundColor: 'rgba(196, 69, 54, 0.15)' };
    case 'reviewed':
      return { backgroundColor: 'rgba(107, 124, 110, 0.18)' };
    case 'dismissed':
      return { backgroundColor: 'rgba(120, 120, 120, 0.18)' };
    case 'action_taken':
      return { backgroundColor: 'rgba(28, 125, 67, 0.18)' };
    default:
      return { backgroundColor: 'rgba(107, 124, 110, 0.18)' };
  }
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  typeBadge: {
    backgroundColor: 'rgba(107, 124, 110, 0.15)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeBadgeText: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    fontWeight: '700',
    color: Brand.neutral,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    fontWeight: '700',
    color: Brand.textLight,
  },
  title: {
    fontFamily: FontFamily.titleBold,
    fontSize: 16,
    marginBottom: 6,
  },
  meta: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    lineHeight: 18,
  },
  details: {
    marginTop: 8,
    fontFamily: FontFamily.body,
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  actionsWrap: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    minHeight: 38,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  warnBtn: {
    backgroundColor: '#B7791F',
    borderColor: '#B7791F',
  },
  hideBtn: {
    backgroundColor: Brand.neutral,
    borderColor: Brand.neutral,
  },
  removeBtn: {
    flex: 0.55,
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  actionText: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    fontWeight: '700',
  },
  actionTextLight: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.5,
  },
});

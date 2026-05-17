import { Image } from 'expo-image';
import { useCallback, useMemo, useState } from 'react';
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
import { useAuth } from '@/contexts/auth-context';
import { useMomentDetailOverlay } from '@/contexts/moment-detail-overlay-context';
import { useMoments } from '@/contexts/moments-context';
import { useSaves } from '@/contexts/saves-context';
import { useThreads, type ThreadItem } from '@/contexts/threads-context';
import type { Moment } from '@/data/mockMoments';
import { useThemeColor } from '@/hooks/use-theme-color';

export function SavedItemsList() {
  const { session } = useAuth();
  const { moments } = useMoments();
  const { threads } = useThreads();
  const {
    savedMomentIds,
    savedThreadIds,
    loading,
    loadError,
    toggleMomentSave,
    toggleThreadSave,
  } = useSaves();
  const { presentMomentById } = useMomentDetailOverlay();

  const textColor = useThemeColor({}, 'text');
  const muted = useThemeColor({}, 'icon');
  const tint = useThemeColor({}, 'tint');
  const cardBg = useThemeColor(
    { light: '#FFFFFF', dark: '#171717' },
    'background',
  );
  const borderColor = useThemeColor(
    { light: '#E2E2E2', dark: '#343434' },
    'text',
  );

  const [busyId, setBusyId] = useState<string | null>(null);

  const savedMoments = useMemo<Moment[]>(
    () => moments.filter((m) => savedMomentIds.has(m.id)),
    [moments, savedMomentIds],
  );
  const savedThreads = useMemo<ThreadItem[]>(
    () => threads.filter((t) => savedThreadIds.has(t.id)),
    [threads, savedThreadIds],
  );

  const onUnsaveMoment = useCallback(
    async (momentId: string) => {
      if (busyId) return;
      setBusyId(momentId);
      const { error } = await toggleMomentSave(momentId);
      setBusyId(null);
      if (error) Alert.alert('Bijwerken mislukt', error);
    },
    [busyId, toggleMomentSave],
  );

  const onUnsaveThread = useCallback(
    async (threadId: string) => {
      if (busyId) return;
      setBusyId(threadId);
      const { error } = await toggleThreadSave(threadId);
      setBusyId(null);
      if (error) Alert.alert('Bijwerken mislukt', error);
    },
    [busyId, toggleThreadSave],
  );

  if (!session?.user?.id) {
    return (
      <Text style={[styles.emptyText, { color: muted }]}>
        Log in om je opgeslagen items te zien.
      </Text>
    );
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={tint} />
      </View>
    );
  }

  if (savedMoments.length === 0 && savedThreads.length === 0) {
    return (
      <Text style={[styles.emptyText, { color: muted }]}>
        Je hebt nog niets opgeslagen. Tik op het bladwijzer-icoon op een moment
        of discussie om het hier te bewaren.
      </Text>
    );
  }

  return (
    <View style={styles.sections}>
      {loadError ? (
        <Text style={[styles.errorText, { color: Brand.primary }]}>{loadError}</Text>
      ) : null}

      <Text style={[styles.sectionLabel, { color: textColor }]}>
        Opgeslagen momenten
      </Text>
      {savedMoments.length === 0 ? (
        <Text style={[styles.emptyText, { color: muted }]}>
          Nog geen momenten bewaard.
        </Text>
      ) : (
        <View style={styles.list}>
          {savedMoments.map((moment) => {
            const isBusy = busyId === moment.id;
            return (
              <Pressable
                key={moment.id}
                onPress={() => presentMomentById(moment.id)}
                style={({ pressed }) => [
                  styles.card,
                  { backgroundColor: cardBg, borderColor },
                  pressed && styles.cardPressed,
                ]}>
                {moment.imageUrl ? (
                  <Image
                    source={{ uri: moment.imageUrl }}
                    style={styles.cardImage}
                    contentFit="cover"
                  />
                ) : null}
                <View style={styles.cardBody}>
                  <Text
                    style={[styles.cardTitle, { color: textColor }]}
                    numberOfLines={2}>
                    {moment.title}
                  </Text>
                  <Text
                    style={[styles.cardMeta, { color: muted }]}
                    numberOfLines={1}>
                    {moment.username}, {moment.location.label}
                  </Text>
                  <Pressable
                    style={[
                      styles.actionBtn,
                      styles.unsaveBtn,
                      isBusy && styles.actionBtnDisabled,
                    ]}
                    disabled={isBusy}
                    onPress={() => void onUnsaveMoment(moment.id)}>
                    {isBusy ? (
                      <ActivityIndicator size="small" color={Brand.primary} />
                    ) : (
                      <Text style={[styles.actionBtnText, styles.unsaveBtnText]}>
                        Verwijder uit opgeslagen
                      </Text>
                    )}
                  </Pressable>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      <Text style={[styles.sectionLabel, { color: textColor }]}>
        Opgeslagen discussies
      </Text>
      {savedThreads.length === 0 ? (
        <Text style={[styles.emptyText, { color: muted }]}>
          Nog geen discussies bewaard.
        </Text>
      ) : (
        <View style={styles.list}>
          {savedThreads.map((thread) => {
            const isBusy = busyId === thread.id;
            const preview =
              thread.body.length > 140
                ? `${thread.body.slice(0, 137).trimEnd()}...`
                : thread.body;
            return (
              <View
                key={thread.id}
                style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                <View style={styles.cardBody}>
                  <Text
                    style={[styles.cardTitle, { color: textColor }]}
                    numberOfLines={2}>
                    {thread.title}
                  </Text>
                  {thread.momentIds?.length ? (
                    <Text
                      style={[styles.cardMeta, { color: muted }]}
                      numberOfLines={1}>
                      Route: {thread.momentIds.length} momenten
                    </Text>
                  ) : null}
                  {preview ? (
                    <Text
                      style={[styles.threadPreview, { color: muted }]}
                      numberOfLines={3}>
                      {preview}
                    </Text>
                  ) : null}
                  <Pressable
                    style={[
                      styles.actionBtn,
                      styles.unsaveBtn,
                      isBusy && styles.actionBtnDisabled,
                    ]}
                    disabled={isBusy}
                    onPress={() => void onUnsaveThread(thread.id)}>
                    {isBusy ? (
                      <ActivityIndicator size="small" color={Brand.primary} />
                    ) : (
                      <Text style={[styles.actionBtnText, styles.unsaveBtnText]}>
                        Verwijder uit opgeslagen
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sections: {
    gap: 8,
  },
  sectionLabel: {
    fontFamily: FontFamily.titleBold,
    fontSize: 16,
    marginTop: 10,
    marginBottom: 8,
  },
  loading: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  list: {
    gap: 14,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  cardBody: {
    padding: 12,
  },
  cardTitle: {
    fontFamily: FontFamily.body,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 4,
  },
  cardMeta: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    marginBottom: 10,
  },
  threadPreview: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  actionBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    marginTop: 4,
  },
  actionBtnDisabled: {
    opacity: 0.6,
  },
  actionBtnText: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    fontWeight: '600',
  },
  unsaveBtn: {
    borderColor: Brand.primary,
    backgroundColor: 'rgba(196, 69, 54, 0.08)',
  },
  unsaveBtnText: {
    color: Brand.primary,
  },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 21,
    paddingVertical: 12,
  },
  errorText: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
});

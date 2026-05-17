import { Image } from 'expo-image';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { FontFamily } from '@/constants/typography';
import { useAuth } from '@/contexts/auth-context';
import { useMoments } from '@/contexts/moments-context';
import { useSaves } from '@/contexts/saves-context';
import { useThreads, type ThreadItem } from '@/contexts/threads-context';
import type { Moment } from '@/data/mockMoments';
import { useThemeColor } from '@/hooks/use-theme-color';

type TabKey = 'created' | 'saved' | 'upvoted' | 'downvoted';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'created', label: 'Mijn momenten' },
  { key: 'saved', label: 'Opgeslagen' },
  { key: 'upvoted', label: 'Upvotes' },
  { key: 'downvoted', label: 'Downvotes' },
];

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const { moments, updateMoment, deleteMoment } = useMoments();
  const { threads } = useThreads();
  const {
    savedMomentIds,
    savedThreadIds,
    loading: savesLoading,
    loadError: savesError,
    toggleMomentSave,
    toggleThreadSave,
  } = useSaves();
  const [signingOut, setSigningOut] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('created');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [unsaveBusyId, setUnsaveBusyId] = useState<string | null>(null);

  const backgroundColor = useThemeColor({}, 'background');
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

  const email = session?.user?.email ?? '';
  const currentUserId = session?.user?.id ?? null;

  const myMoments = useMemo<Moment[]>(() => {
    if (!currentUserId) return [];
    return moments.filter((m) => m.ownerId === currentUserId);
  }, [moments, currentUserId]);

  const savedMoments = useMemo<Moment[]>(
    () => moments.filter((m) => savedMomentIds.has(m.id)),
    [moments, savedMomentIds],
  );
  const savedThreads = useMemo<ThreadItem[]>(
    () => threads.filter((t) => savedThreadIds.has(t.id)),
    [threads, savedThreadIds],
  );

  const onSignOut = useCallback(async () => {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
  }, [signOut]);

  const onTogglePrivacy = useCallback(
    async (moment: Moment) => {
      if (busyId) return;
      setBusyId(moment.id);
      const next = !(moment.isPublic ?? true);
      const { error } = await updateMoment(moment.id, { isPublic: next });
      setBusyId(null);
      if (error) {
        Alert.alert('Bijwerken mislukt', error);
      }
    },
    [busyId, updateMoment],
  );

  const onUnsaveMoment = useCallback(
    async (momentId: string) => {
      if (unsaveBusyId) return;
      setUnsaveBusyId(momentId);
      const { error } = await toggleMomentSave(momentId);
      setUnsaveBusyId(null);
      if (error) Alert.alert('Bijwerken mislukt', error);
    },
    [toggleMomentSave, unsaveBusyId],
  );

  const onUnsaveThread = useCallback(
    async (threadId: string) => {
      if (unsaveBusyId) return;
      setUnsaveBusyId(threadId);
      const { error } = await toggleThreadSave(threadId);
      setUnsaveBusyId(null);
      if (error) Alert.alert('Bijwerken mislukt', error);
    },
    [toggleThreadSave, unsaveBusyId],
  );

  const onDelete = useCallback(
    (moment: Moment) => {
      Alert.alert(
        'Moment verwijderen',
        'Weet je zeker dat je dit moment definitief wilt verwijderen?',
        [
          { text: 'Annuleren', style: 'cancel' },
          {
            text: 'Verwijderen',
            style: 'destructive',
            onPress: async () => {
              setBusyId(moment.id);
              const { error } = await deleteMoment(moment.id);
              setBusyId(null);
              if (error) {
                Alert.alert('Verwijderen mislukt', error);
              }
            },
          },
        ],
      );
    },
    [deleteMoment],
  );

  const renderCreatedTab = () => {
    if (!currentUserId) {
      return (
        <Text style={[styles.emptyText, { color: muted }]}>
          Log in om je eigen momenten te zien.
        </Text>
      );
    }
    if (myMoments.length === 0) {
      return (
        <Text style={[styles.emptyText, { color: muted }]}>
          Je hebt nog geen momenten gedeeld.
        </Text>
      );
    }
    return (
      <View style={styles.list}>
        {myMoments.map((moment) => {
          const isPublic = moment.isPublic ?? true;
          const isBusy = busyId === moment.id;
          return (
            <View
              key={moment.id}
              style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
              {moment.imageUrl ? (
                <Image
                  source={{ uri: moment.imageUrl }}
                  style={styles.cardImage}
                  contentFit="cover"
                />
              ) : null}
              <View style={styles.cardBody}>
                <View style={styles.cardHeaderRow}>
                  <Text
                    style={[styles.cardTitle, { color: textColor }]}
                    numberOfLines={2}>
                    {moment.title}
                  </Text>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: isPublic
                          ? 'rgba(28, 125, 67, 0.15)'
                          : 'rgba(196, 69, 54, 0.15)',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.badgeText,
                        { color: isPublic ? '#1C7D43' : Brand.primary },
                      ]}>
                      {isPublic ? 'Publiek' : 'Privé'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.cardMeta, { color: muted }]} numberOfLines={1}>
                  {moment.location.label}
                </Text>

                <View style={styles.actionsRow}>
                  <Pressable
                    style={[
                      styles.actionBtn,
                      { borderColor },
                      isBusy && styles.actionBtnDisabled,
                    ]}
                    disabled={isBusy}
                    onPress={() => void onTogglePrivacy(moment)}>
                    {isBusy ? (
                      <ActivityIndicator size="small" color={textColor} />
                    ) : (
                      <Text
                        style={[styles.actionBtnText, { color: textColor }]}>
                        {isPublic ? 'Maak privé' : 'Maak publiek'}
                      </Text>
                    )}
                  </Pressable>
                  <Pressable
                    style={[
                      styles.actionBtn,
                      styles.deleteBtn,
                      isBusy && styles.actionBtnDisabled,
                    ]}
                    disabled={isBusy}
                    onPress={() => onDelete(moment)}>
                    <Text style={[styles.actionBtnText, styles.deleteBtnText]}>
                      Verwijderen
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderSavedTab = () => {
    if (!currentUserId) {
      return (
        <Text style={[styles.emptyText, { color: muted }]}>
          Log in om je opgeslagen items te zien.
        </Text>
      );
    }
    if (savesLoading) {
      return (
        <View style={styles.savedLoading}>
          <ActivityIndicator color={tint} />
        </View>
      );
    }
    if (savedMoments.length === 0 && savedThreads.length === 0) {
      return (
        <Text style={[styles.emptyText, { color: muted }]}>
          Je hebt nog niets opgeslagen. Tik op het bladwijzer-icoon op een
          moment of discussie om het hier te bewaren.
        </Text>
      );
    }
    return (
      <View style={styles.savedSections}>
        {savesError ? (
          <Text style={[styles.errorText, { color: Brand.primary }]}>
            {savesError}
          </Text>
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
              const isBusy = unsaveBusyId === moment.id;
              return (
                <View
                  key={moment.id}
                  style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
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
                        <Text
                          style={[styles.actionBtnText, styles.unsaveBtnText]}>
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
              const isBusy = unsaveBusyId === thread.id;
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
                        <Text
                          style={[styles.actionBtnText, styles.unsaveBtnText]}>
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
  };

  const renderPlaceholderTab = (label: string) => (
    <View style={styles.placeholderBox}>
      <Text style={[styles.placeholderTitle, { color: textColor }]}>
        Binnenkort beschikbaar
      </Text>
      <Text style={[styles.placeholderText, { color: muted }]}>
        Hier verschijnen je {label.toLowerCase()} zodra deze functie is toegevoegd.
      </Text>
    </View>
  );

  let tabContent: React.ReactNode = null;
  if (activeTab === 'created') tabContent = renderCreatedTab();
  else if (activeTab === 'saved') tabContent = renderSavedTab();
  else if (activeTab === 'upvoted') tabContent = renderPlaceholderTab('upvotes');
  else if (activeTab === 'downvoted') tabContent = renderPlaceholderTab('downvotes');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={[styles.emailLabel, { color: muted }]}>Ingelogd als</Text>
        <Text style={[styles.email, { color: textColor }]}>{email || '—'}</Text>

        <Pressable
          style={({ pressed }) => [
            styles.signOutBtn,
            { borderColor: tint, opacity: pressed || signingOut ? 0.75 : 1 },
          ]}
          onPress={() => void onSignOut()}
          disabled={signingOut}>
          {signingOut ? (
            <ActivityIndicator color={tint} />
          ) : (
            <Text style={[styles.signOutLabel, { color: tint }]}>Uitloggen</Text>
          )}
        </Pressable>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}>
          {TABS.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <Pressable
                key={tab.key}
                style={[
                  styles.tabChip,
                  { borderColor },
                  isActive && { backgroundColor: tint, borderColor: tint },
                ]}
                onPress={() => setActiveTab(tab.key)}>
                <Text
                  style={[
                    styles.tabChipText,
                    { color: isActive ? '#FFFFFF' : textColor },
                  ]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.tabContent}>{tabContent}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  emailLabel: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    marginBottom: 4,
  },
  email: {
    fontFamily: FontFamily.body,
    fontSize: 17,
    marginBottom: 20,
  },
  signOutBtn: {
    borderWidth: StyleSheet.hairlineWidth + 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginBottom: 20,
  },
  signOutLabel: {
    fontFamily: FontFamily.body,
    fontSize: 15,
    fontWeight: '600',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 6,
    paddingRight: 4,
  },
  tabChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tabChipText: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    fontWeight: '600',
  },
  tabContent: {
    marginTop: 16,
  },
  list: {
    gap: 14,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  cardBody: {
    padding: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 4,
  },
  cardTitle: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    fontWeight: '700',
  },
  cardMeta: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  actionBtnDisabled: {
    opacity: 0.6,
  },
  actionBtnText: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    fontWeight: '600',
  },
  deleteBtn: {
    borderColor: Brand.primary,
    backgroundColor: 'rgba(196, 69, 54, 0.08)',
  },
  deleteBtnText: {
    color: Brand.primary,
  },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 21,
    paddingVertical: 18,
  },
  placeholderBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(107, 124, 110, 0.35)',
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'rgba(107, 124, 110, 0.06)',
  },
  placeholderTitle: {
    fontFamily: FontFamily.titleBold,
    fontSize: 16,
    marginBottom: 6,
  },
  placeholderText: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 20,
  },
  savedSections: {
    gap: 8,
  },
  sectionLabel: {
    fontFamily: FontFamily.titleBold,
    fontSize: 16,
    marginTop: 10,
    marginBottom: 8,
  },
  savedLoading: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  unsaveBtn: {
    borderColor: Brand.primary,
    backgroundColor: 'rgba(196, 69, 54, 0.08)',
    marginTop: 4,
  },
  unsaveBtnText: {
    color: Brand.primary,
  },
  threadPreview: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
});

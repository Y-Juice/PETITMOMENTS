import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { MomentCard } from "@/components/moment-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Brand, getMomentCardColors } from "@/constants/theme";
import { FontFamily } from "@/constants/typography";
import { useAuth } from "@/contexts/auth-context";
import { useMomentDetailOverlay } from "@/contexts/moment-detail-overlay-context";
import { useMoments } from "@/contexts/moments-context";
import { useSaves } from "@/contexts/saves-context";
import { useThreads, type ThreadItem } from "@/contexts/threads-context";
import type { Moment } from "@/data/mockMoments";
import { useThemeColor } from "@/hooks/use-theme-color";

export function SavedItemsList() {
  const { session } = useAuth();
  const { moments } = useMoments();
  const { threads } = useThreads();
  const {
    savedMomentIds,
    savedThreadIds,
    loading,
    loadError,
    toggleThreadSave,
  } = useSaves();
  const { presentMomentById } = useMomentDetailOverlay();

  const textColor = useThemeColor({}, "text");
  const muted = useThemeColor({}, "icon");
  const tint = useThemeColor({}, "tint");

  const [busyId, setBusyId] = useState<string | null>(null);

  const savedMoments = useMemo<Moment[]>(
    () => moments.filter((m) => savedMomentIds.has(m.id)),
    [moments, savedMomentIds],
  );
  const savedThreads = useMemo<ThreadItem[]>(
    () => threads.filter((t) => savedThreadIds.has(t.id)),
    [threads, savedThreadIds],
  );

  const onUnsaveThread = useCallback(
    async (threadId: string) => {
      if (busyId) return;
      setBusyId(threadId);
      const { error } = await toggleThreadSave(threadId);
      setBusyId(null);
      if (error) Alert.alert("Bijwerken mislukt", error);
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
      <EmptyState
        icon="bookmark-border"
        title="Nog niets opgeslagen"
        message="Tik op het bladwijzer-icoon op een moment of discussie om het hier te bewaren."
      />
    );
  }

  const momentsCount = savedMoments.length;

  return (
    <View style={styles.sections}>
      {loadError ? (
        <Text style={[styles.errorText, { color: Brand.primary }]}>
          {loadError}
        </Text>
      ) : null}

      <Text style={[styles.sectionLabel, { color: textColor }]}>
        Opgeslagen momenten
      </Text>
      {momentsCount === 0 ? (
        <Text style={[styles.emptyText, { color: muted }]}>
          Nog geen momenten bewaard. Tik in een moment op &quot;Bewaar&quot; om
          het hier te zien.
        </Text>
      ) : (
        <View style={styles.momentList}>
          {savedMoments.map((moment, index) => {
            const position =
              momentsCount === 1
                ? "single"
                : index === 0
                  ? "first"
                  : index === momentsCount - 1
                    ? "last"
                    : "middle";
            return (
              <MomentCard
                key={moment.id}
                moment={moment}
                colorIndex={index}
                position={position}
                onPress={() => presentMomentById(moment.id)}
              />
            );
          })}
        </View>
      )}

      <Text style={[styles.sectionLabel, { color: textColor }]}>
        Opgeslagen discussies
      </Text>
      {savedThreads.length === 0 ? (
        <Text style={[styles.emptyText, { color: muted }]}>
          Nog geen discussies bewaard. Tik op het bladwijzer-icoon naast een
          discussie om het hier te zien.
        </Text>
      ) : (
        <View style={styles.threadList}>
          {savedThreads.map((thread, index) => {
            const palette = getMomentCardColors(index);
            const isBusy = busyId === thread.id;
            const preview =
              thread.body.length > 160
                ? `${thread.body.slice(0, 157).trimEnd()}...`
                : thread.body;
            return (
              <View
                key={thread.id}
                style={[styles.threadCard, { backgroundColor: palette.bg }]}
              >
                <View style={styles.threadHeaderRow}>
                  <Text
                    style={[styles.threadTitle, { color: palette.text }]}
                    numberOfLines={2}
                  >
                    {thread.title}
                  </Text>
                  <Pressable
                    onPress={() => void onUnsaveThread(thread.id)}
                    disabled={isBusy}
                    style={({ pressed }) => [
                      styles.threadSaveBtn,
                      { borderColor: palette.text },
                      pressed && styles.threadSaveBtnPressed,
                      isBusy && styles.threadSaveBtnDisabled,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Verwijder uit opgeslagen"
                  >
                    {isBusy ? (
                      <ActivityIndicator size="small" color={palette.text} />
                    ) : (
                      <MaterialIcons
                        name="bookmark"
                        size={20}
                        color={palette.text}
                      />
                    )}
                  </Pressable>
                </View>

                {thread.momentIds?.length ? (
                  <Text style={[styles.threadMeta, { color: palette.sub }]}>
                    Route: {thread.momentIds.length} momenten
                  </Text>
                ) : null}

                {preview ? (
                  <Text
                    style={[styles.threadBody, { color: palette.sub }]}
                    numberOfLines={4}
                  >
                    {preview}
                  </Text>
                ) : null}
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
    marginTop: 16,
    marginBottom: 8,
  },
  loading: {
    paddingVertical: 20,
    alignItems: "center",
  },
  /** Matches the stacked look of MomentCard on the home feed (cards overlap each other). */
  momentList: {
    paddingTop: 50,
  },
  threadList: {
    gap: 12,
  },
  threadCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  threadHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 6,
  },
  threadTitle: {
    flex: 1,
    fontFamily: FontFamily.titleBold,
    fontSize: 17,
    lineHeight: 22,
  },
  threadSaveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  threadSaveBtnPressed: {
    opacity: 0.85,
  },
  threadSaveBtnDisabled: {
    opacity: 0.7,
  },
  threadMeta: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  threadBody: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 20,
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

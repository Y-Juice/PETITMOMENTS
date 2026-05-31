import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { ContentWarningGate } from "@/components/content-warning-gate";
import { ReportContentButton } from "@/components/report-content-button";
import { VoteWidget } from "@/components/vote-widget";
import { getCardColorsForId, isPaletteOnDark } from "@/constants/theme";
import { FontFamily } from "@/constants/typography";
import { useSaves } from "@/contexts/saves-context";
import { useThreads } from "@/contexts/threads-context";
import { useVotes } from "@/contexts/votes-context";
import { hasContentWarning } from "@/data/moderation";
import { feedbackSelectionTap } from "@/utils/feedback";

const FALLBACK_BG = "#9236C4";
const DIM_OVERLAY = "rgba(0, 0, 0, 0.42)";

type ThreadDetailOverlayValue = {
  presentThreadById: (id: string) => void;
  dismiss: () => void;
};

const ThreadDetailOverlayContext = createContext<
  ThreadDetailOverlayValue | undefined
>(undefined);

export function ThreadDetailOverlayProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [savingToggle, setSavingToggle] = useState(false);
  const visible = openId !== null;

  const { threads, loading } = useThreads();
  const { isThreadSaved, toggleThreadSave } = useSaves();
  const { threadSummary, myThreadVote, voteOnThread } = useVotes();

  const thread = useMemo(() => {
    if (!openId) return undefined;
    return threads.find((t) => t.id === openId);
  }, [openId, threads]);

  const presentThreadById = useCallback((id: string) => {
    const t = String(id).trim();
    if (t) {
      feedbackSelectionTap();
      setOpenId(t);
    }
  }, []);

  const dismiss = useCallback(() => {
    setOpenId(null);
  }, []);

  useEffect(() => {
    if (visible) {
      setStatusBarStyle("light");
    } else {
      setStatusBarStyle("auto");
    }
    return () => {
      setStatusBarStyle("auto");
    };
  }, [visible]);

  const value = useMemo(
    (): ThreadDetailOverlayValue => ({
      presentThreadById,
      dismiss,
    }),
    [presentThreadById, dismiss],
  );

  const saved = thread ? isThreadSaved(thread.id) : false;
  const voteSummary = thread ? threadSummary(thread.id) : null;
  const myVote = thread ? myThreadVote(thread.id) : null;
  const momentCount = thread?.momentIds?.length ?? 0;
  const palette = thread ? getCardColorsForId(thread.id) : null;
  const cardBg = palette?.bg ?? FALLBACK_BG;
  const textColor = palette?.text ?? "#FFFFFF";
  const onDark = palette ? isPaletteOnDark(palette) : true;
  const surfaceColor = onDark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.10)";

  const onToggleSave = useCallback(async () => {
    if (!thread || savingToggle) return;
    setSavingToggle(true);
    await toggleThreadSave(thread.id);
    setSavingToggle(false);
  }, [thread, savingToggle, toggleThreadSave]);

  const onShowOnMap = useCallback(() => {
    if (!thread) return;
    feedbackSelectionTap();
    dismiss();
    router.push({
      pathname: "/map",
      params: { threadId: thread.id, ts: String(Date.now()) },
    });
  }, [thread, dismiss, router]);

  const onFollowRoute = useCallback(() => {
    if (!thread) return;
    feedbackSelectionTap();
    dismiss();
    router.push({
      pathname: "/map",
      params: { followThreadId: thread.id, ts: String(Date.now()) },
    });
  }, [thread, dismiss, router]);

  return (
    <ThreadDetailOverlayContext.Provider value={value}>
      {children}

      <Modal
        animationType="fade"
        transparent
        visible={visible}
        onRequestClose={dismiss}
        statusBarTranslucent
        {...(Platform.OS === "ios"
          ? { presentationStyle: "overFullScreen" as const }
          : {})}
      >
        <View style={styles.modalRoot}>
          <BlurView
            intensity={Platform.OS === "web" ? 48 : 72}
            tint="dark"
            pointerEvents="none"
            style={StyleSheet.absoluteFillObject}
          />
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: DIM_OVERLAY },
            ]}
          />

          <Pressable
            style={StyleSheet.absoluteFillObject}
            accessibilityLabel="Achtergrond — tik om te sluiten"
            accessibilityRole="button"
            onPress={dismiss}
          />

          <View pointerEvents="box-none" style={styles.foregroundLayer}>
            <SafeAreaView
              edges={["top"]}
              pointerEvents="box-none"
              style={styles.safeTop}
            >
              <View style={styles.topBar} pointerEvents="box-none">
                <View pointerEvents="none" style={styles.topBarSpacer} />
                <Pressable
                  onPress={dismiss}
                  style={({ pressed }) => [
                    styles.closeBtn,
                    pressed && styles.closeBtnPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Sluiten"
                >
                  <MaterialIcons name="close" size={26} color="#FFFFFF" />
                </Pressable>
              </View>
            </SafeAreaView>

            <View style={styles.cardColumn} pointerEvents="box-none">
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                bounces
              >
                {!openId ? null : loading && !thread ? (
                  <View style={[styles.stateCard, styles.stateCardCenter]}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                  </View>
                ) : !thread ? (
                  <View style={styles.stateCard}>
                    <Text style={styles.stateText}>
                      Deze discussie is niet (meer) gevonden.
                    </Text>
                  </View>
                ) : (
                  <Animated.View
                    key={thread.id}
                    entering={FadeIn.duration(220).withInitialValues({
                      transform: [{ scale: 0.96 }],
                    })}
                    style={styles.cardShadow}
                  >
                    <View style={[styles.card, { backgroundColor: cardBg }]}>
                      <View
                        style={[styles.tagRow, { backgroundColor: surfaceColor }]}
                      >
                        <MaterialIcons
                          name="timeline"
                          size={16}
                          color={textColor}
                        />
                        <Text style={[styles.tagText, { color: textColor }]}>
                          Rode draad
                        </Text>
                      </View>

                      <View style={styles.titleRow}>
                        <Text style={[styles.title, { color: textColor }]}>
                          {thread.title}
                        </Text>
                        <ReportContentButton
                          targetType="thread"
                          targetId={thread.id}
                          targetLabel={thread.title}
                          iconColor={textColor}
                        />
                      </View>

                      {voteSummary ? (
                        <View style={styles.voteWrap}>
                          <VoteWidget
                            score={voteSummary.score}
                            myVote={myVote}
                            onUp={() => void voteOnThread(thread.id, "up")}
                            onDown={() => void voteOnThread(thread.id, "down")}
                            size="large"
                            baseColor={textColor}
                            surfaceColor={surfaceColor}
                          />
                        </View>
                      ) : null}

                      <View style={styles.statsRow}>
                        <View
                          style={[styles.statBox, { backgroundColor: surfaceColor }]}
                        >
                          <MaterialIcons
                            name="thumb-up"
                            size={16}
                            color={textColor}
                          />
                          <Text style={[styles.statText, { color: textColor }]}>
                            {voteSummary?.up ?? 0} upvotes
                          </Text>
                        </View>
                        <View
                          style={[styles.statBox, { backgroundColor: surfaceColor }]}
                        >
                          <MaterialIcons
                            name="thumb-down"
                            size={16}
                            color={textColor}
                          />
                          <Text style={[styles.statText, { color: textColor }]}>
                            {voteSummary?.down ?? 0} downvotes
                          </Text>
                        </View>
                        <View
                          style={[styles.statBox, { backgroundColor: surfaceColor }]}
                        >
                          <MaterialIcons
                            name="place"
                            size={16}
                            color={textColor}
                          />
                          <Text style={[styles.statText, { color: textColor }]}>
                            {momentCount} momenten
                          </Text>
                        </View>
                      </View>

                      {thread.body ? (
                        hasContentWarning(thread) ? (
                          <ContentWarningGate
                            item={thread}
                            style={styles.warningBlock}
                          >
                            <Text
                              style={[styles.description, { color: textColor }]}
                            >
                              {thread.body}
                            </Text>
                          </ContentWarningGate>
                        ) : (
                          <Text style={[styles.description, { color: textColor }]}>
                            {thread.body}
                          </Text>
                        )
                      ) : null}

                      <Pressable
                        onPress={onShowOnMap}
                        style={({ pressed }) => [
                          styles.mapBtn,
                          { backgroundColor: textColor },
                          pressed && styles.mapBtnPressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel="Toon deze rode draad op de kaart"
                      >
                        <MaterialIcons name="map" size={20} color={cardBg} />
                        <Text style={[styles.mapBtnText, { color: cardBg }]}>
                          Toon op kaart
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={onFollowRoute}
                        style={({ pressed }) => [
                          styles.followBtn,
                          { borderColor: textColor, backgroundColor: surfaceColor },
                          pressed && styles.mapBtnPressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel="Volg deze route met je locatie"
                      >
                        <MaterialIcons
                          name="navigation"
                          size={20}
                          color={textColor}
                        />
                        <Text style={[styles.followBtnText, { color: textColor }]}>
                          Volg route
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => void onToggleSave()}
                        disabled={savingToggle}
                        style={({ pressed }) => [
                          styles.saveBtn,
                          { borderColor: textColor },
                          saved && { backgroundColor: surfaceColor },
                          pressed && styles.saveBtnPressed,
                          savingToggle && styles.saveBtnDisabled,
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: saved }}
                        accessibilityLabel={
                          saved
                            ? "Verwijder uit opgeslagen discussies"
                            : "Bewaar deze discussie"
                        }
                      >
                        {savingToggle ? (
                          <ActivityIndicator size="small" color={textColor} />
                        ) : (
                          <>
                            <MaterialIcons
                              name={saved ? "bookmark" : "bookmark-border"}
                              size={20}
                              color={textColor}
                            />
                            <Text style={[styles.saveBtnText, { color: textColor }]}>
                              {saved ? "Bewaard" : "Bewaar"}
                            </Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  </Animated.View>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </ThreadDetailOverlayContext.Provider>
  );
}

export function useThreadDetailOverlay(): ThreadDetailOverlayValue {
  const ctx = useContext(ThreadDetailOverlayContext);
  if (!ctx) {
    throw new Error(
      "useThreadDetailOverlay must be used inside ThreadDetailOverlayProvider",
    );
  }
  return ctx;
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  foregroundLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  safeTop: {
    backgroundColor: "transparent",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  topBarSpacer: {
    flex: 1,
  },
  closeBtn: {
    padding: 10,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  closeBtnPressed: {
    opacity: 0.75,
  },
  cardColumn: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 4,
  },
  scroll: {
    alignSelf: "stretch",
    maxHeight: "88%",
  },
  scrollContent: {
    paddingVertical: 12,
  },
  cardShadow: {
    borderRadius: 40,
    overflow: Platform.OS === "android" ? "hidden" : "visible",
    elevation: Platform.OS === "android" ? 12 : 0,
    ...(Platform.OS === "ios"
      ? {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.35,
          shadowRadius: 24,
        }
      : {}),
  },
  card: {
    borderRadius: 40,
    paddingHorizontal: 28,
    paddingTop: 22,
    paddingBottom: 28,
    overflow: "hidden",
  },
  stateCard: {
    backgroundColor: FALLBACK_BG,
    borderRadius: 40,
    padding: 36,
    minHeight: 160,
    justifyContent: "center",
    alignItems: "center",
  },
  stateCardCenter: {
    minHeight: 200,
  },
  stateText: {
    fontFamily: FontFamily.body,
    fontSize: 16,
    color: "rgba(255,255,255,0.95)",
    textAlign: "center",
    lineHeight: 23,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginBottom: 12,
  },
  tagText: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  title: {
    flex: 1,
    fontFamily: FontFamily.titleBold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.4,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  voteWrap: {
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
  },
  statBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.16)",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statText: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  warningBlock: {
    marginBottom: 18,
  },
  description: {
    fontFamily: FontFamily.body,
    fontSize: 16,
    lineHeight: 25,
    color: "#FFFFFF",
    marginBottom: 18,
  },
  mapBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    marginBottom: 14,
    minHeight: 48,
  },
  mapBtnPressed: {
    opacity: 0.85,
  },
  mapBtnText: {
    fontFamily: FontFamily.body,
    fontSize: 15,
    fontWeight: "700",
  },
  followBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.7)",
    backgroundColor: "rgba(255,255,255,0.16)",
    marginBottom: 14,
    minHeight: 48,
  },
  followBtnText: {
    fontFamily: FontFamily.body,
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  saveBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.55)",
    backgroundColor: "rgba(255,255,255,0.0)",
    minHeight: 40,
  },
  saveBtnActive: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderColor: "#FFFFFF",
  },
  saveBtnPressed: {
    opacity: 0.82,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

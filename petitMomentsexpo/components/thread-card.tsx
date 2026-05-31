import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { ContentWarningBadge } from "@/components/content-warning-gate";
import { getCardColorsForId, isPaletteOnDark } from "@/constants/theme";
import { FontFamily } from "@/constants/typography";
import { useThreadDetailOverlay } from "@/contexts/thread-detail-overlay-context";
import type { ThreadItem } from "@/contexts/threads-context";
import { useVotes } from "@/contexts/votes-context";
import { hasContentWarning } from "@/data/moderation";

type Props = {
  thread: ThreadItem;
  style?: StyleProp<ViewStyle>;
};

/**
 * Vierkante discussiekaart voor de 2-koloms stapel op de homepagina.
 * Toont enkel titel, aantal momenten en de score. Stemmen kan pas in de
 * detailweergave (die je opent door op de kaart te tikken).
 */
export function ThreadCard({ thread, style }: Props) {
  const palette = getCardColorsForId(thread.id);
  const onDark = isPaletteOnDark(palette);
  const { threadSummary } = useVotes();
  const { presentThreadById } = useThreadDetailOverlay();
  const summary = threadSummary(thread.id);
  const momentCount = thread.momentIds?.length ?? 0;

  const pillBg = onDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.10)";

  return (
    <Pressable
      onPress={() => presentThreadById(thread.id)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: palette.bg },
        pressed && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Open discussie ${thread.title}`}
    >
      <View style={styles.tagRow}>
        <MaterialIcons name="timeline" size={14} color={palette.text} />
        <Text style={[styles.tagText, { color: palette.text }]}>
          Rode draad
        </Text>
      </View>

      <Text style={[styles.title, { color: palette.text }]} numberOfLines={2}>
        {thread.title}
      </Text>

      {hasContentWarning(thread) ? (
        <ContentWarningBadge labels={thread.contentWarning} />
      ) : null}

      <View style={styles.footer}>
        <View style={[styles.pill, { backgroundColor: pillBg }]}>
          <MaterialIcons name="place" size={14} color={palette.text} />
          <Text style={[styles.pillText, { color: palette.text }]}>
            {momentCount}
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: pillBg }]}>
          <MaterialIcons name="thumbs-up-down" size={14} color={palette.text} />
          <Text style={[styles.pillText, { color: palette.text }]}>
            {summary.score}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 46,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
  },
  pressed: {
    opacity: 0.92,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  tagText: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    fontWeight: "700",
    opacity: 0.9,
  },
  title: {
    fontFamily: FontFamily.titleBold,
    fontSize: 17,
    lineHeight: 22,
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  pillText: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    fontWeight: "700",
  },
});

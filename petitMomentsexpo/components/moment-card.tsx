import { Pressable, StyleSheet, Text, View } from "react-native";

import { VoteWidget } from "@/components/vote-widget";
import { ContentWarningBadge } from "@/components/content-warning-gate";
import { hasContentWarning } from "@/data/moderation";
import { getMomentCardColors } from "@/constants/theme";
import { FontFamily } from "@/constants/typography";
import { useVotes } from "@/contexts/votes-context";
import type { Moment } from "@/data/mockMoments";

type Props = {
  moment: Moment;
  /** List index (0-based); drives red → green → blue cycling. */
  colorIndex: number;
  position: "first" | "middle" | "last" | "single";
  onPress?: () => void;
};

export function MomentCard({ moment, colorIndex, position, onPress }: Props) {
  const colors = getMomentCardColors(colorIndex);
  const { momentSummary, myMomentVote, voteOnMoment } = useVotes();
  const summary = momentSummary(moment.id);
  const myVote = myMomentVote(moment.id);

  const radiusStyle =
    position === "single"
      ? styles.radiusAll
      : position === "first"
        ? styles.radiusTop
        : position === "last"
          ? styles.radiusBottom
          : styles.radiusNone;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.bg },
        radiusStyle,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.row}>
        <View style={styles.textCol}>
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={2}
          >
            {moment.title}
          </Text>
          {hasContentWarning(moment) ? (
            <ContentWarningBadge labels={moment.contentWarning} />
          ) : null}
          <Text style={[styles.subtitle, { color: colors.sub }]}>
            {moment.username}, {moment.location.label}
          </Text>
        </View>
        <View style={styles.voteWrap}>
          <VoteWidget
            score={summary.score}
            myVote={myVote}
            onUp={() => void voteOnMoment(moment.id, "up")}
            onDown={() => void voteOnMoment(moment.id, "down")}
            size="compact"
            baseColor={colors.text}
            surfaceColor="rgba(255,255,255,0.16)"
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: -40,
    borderRadius: 15,
    paddingHorizontal: 18,
    paddingVertical: 16,
    paddingBottom: 50,
    overflow: "hidden",
  },
  radiusAll: {
    borderRadius: 16,
  },
  radiusTop: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  radiusBottom: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  radiusNone: {},
  pressed: {
    opacity: 0.92,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: FontFamily.body,
    fontSize: 18,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: 14,
  },
  voteWrap: {
    alignItems: "flex-end",
  },
});

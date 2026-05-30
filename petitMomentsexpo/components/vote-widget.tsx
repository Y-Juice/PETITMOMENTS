import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { feedbackDownvote, feedbackUpvote } from "@/utils/feedback";
import type { VoteDirection } from "@/utils/votes-supabase";

type VoteWidgetProps = {
  score: number;
  myVote: VoteDirection | null;
  onUp: () => void;
  onDown: () => void;
  /** Compact for cards in lists, large for the detail overlay. */
  size?: "compact" | "large";
  /** Force the icon/text colour (the overlay uses white-on-red). */
  baseColor?: string;
  /** Background colour of the inactive pill (defaults to transparent). */
  surfaceColor?: string;
  disabled?: boolean;
};

const UP_COLOR = "#2E7D4A";
const DOWN_COLOR = "#C62828";

export function VoteWidget({
  score,
  myVote,
  onUp,
  onDown,
  size = "compact",
  baseColor,
  surfaceColor,
  disabled,
}: VoteWidgetProps) {
  const isUpActive = myVote === "up";
  const isDownActive = myVote === "down";
  const isLarge = size === "large";

  const iconSize = isLarge ? 22 : 18;
  const buttonSize = isLarge ? 38 : 32;
  const radius = buttonSize / 2;
  const padding = isLarge ? 8 : 6;

  const idleColor = baseColor ?? "#3A3A3A";
  const scoreColor = score > 0 ? UP_COLOR : score < 0 ? DOWN_COLOR : idleColor;

  const handleUp = () => {
    feedbackUpvote();
    onUp();
  };

  const handleDown = () => {
    feedbackDownvote();
    onDown();
  };

  return (
    <View
      style={[
        styles.row,
        { gap: padding },
        surfaceColor ? { backgroundColor: surfaceColor } : undefined,
        styles.rowPadding,
      ]}
    >
      <Pressable
        onPress={handleUp}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={isUpActive ? "Upvote ongedaan maken" : "Upvote"}
        accessibilityState={{ selected: isUpActive }}
        style={({ pressed }) => [
          styles.btn,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: radius,
            borderColor: isUpActive ? UP_COLOR : `${idleColor}33`,
            backgroundColor: isUpActive ? UP_COLOR : "transparent",
          },
          pressed && styles.pressed,
          disabled && styles.disabled,
        ]}
      >
        <MaterialIcons
          name="arrow-upward"
          size={iconSize}
          color={isUpActive ? "#FFFFFF" : idleColor}
        />
      </Pressable>

      <Text
        style={[
          styles.score,
          { color: scoreColor, fontSize: isLarge ? 16 : 14 },
        ]}
      >
        {score}
      </Text>

      <Pressable
        onPress={handleDown}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={
          isDownActive ? "Downvote ongedaan maken" : "Downvote"
        }
        accessibilityState={{ selected: isDownActive }}
        style={({ pressed }) => [
          styles.btn,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: radius,
            borderColor: isDownActive ? DOWN_COLOR : `${idleColor}33`,
            backgroundColor: isDownActive ? DOWN_COLOR : "transparent",
          },
          pressed && styles.pressed,
          disabled && styles.disabled,
        ]}
      >
        <MaterialIcons
          name="arrow-downward"
          size={iconSize}
          color={isDownActive ? "#FFFFFF" : idleColor}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
  },
  rowPadding: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  btn: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.6,
  },
  score: {
    fontWeight: "700",
    minWidth: 18,
    textAlign: "center",
  },
});

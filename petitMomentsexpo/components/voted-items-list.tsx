import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { MomentCard } from "@/components/moment-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Brand, getMomentCardColors } from "@/constants/theme";
import { FontFamily } from "@/constants/typography";
import { useAuth } from "@/contexts/auth-context";
import { useMomentDetailOverlay } from "@/contexts/moment-detail-overlay-context";
import { useMoments } from "@/contexts/moments-context";
import { useThreads, type ThreadItem } from "@/contexts/threads-context";
import { useVotes } from "@/contexts/votes-context";
import type { Moment } from "@/data/mockMoments";
import { useThemeColor } from "@/hooks/use-theme-color";
import type { VoteDirection } from "@/utils/votes-supabase";

type Props = {
  direction: VoteDirection;
};

export function VotedItemsList({ direction }: Props) {
  const { session } = useAuth();
  const { moments } = useMoments();
  const { threads } = useThreads();
  const { myMomentVotes, myThreadVotes, loading, loadError } = useVotes();
  const { presentMomentById } = useMomentDetailOverlay();

  const textColor = useThemeColor({}, "text");
  const muted = useThemeColor({}, "icon");
  const tint = useThemeColor({}, "tint");

  const votedMoments = useMemo<Moment[]>(() => {
    const ids = new Set<string>();
    myMomentVotes.forEach((dir, id) => {
      if (dir === direction) ids.add(id);
    });
    return moments.filter((m) => ids.has(m.id));
  }, [moments, myMomentVotes, direction]);

  const votedThreads = useMemo<ThreadItem[]>(() => {
    const ids = new Set<string>();
    myThreadVotes.forEach((dir, id) => {
      if (dir === direction) ids.add(id);
    });
    return threads.filter((t) => ids.has(t.id));
  }, [threads, myThreadVotes, direction]);

  if (!session?.user?.id) {
    return (
      <Text style={[styles.emptyText, { color: muted }]}>
        Log in om je stemmen te zien.
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

  const totalCount = votedMoments.length + votedThreads.length;
  const labelWord = direction === "up" ? "geüpvote" : "gedownvote";

  if (totalCount === 0) {
    return (
      <EmptyState
        icon={direction === "up" ? "thumb-up-off-alt" : "thumb-down-off-alt"}
        title={`Nog niets ${labelWord}`}
        message="Gebruik de pijl-knoppen op een moment of discussie om hier dingen te verzamelen."
      />
    );
  }

  const momentsCount = votedMoments.length;

  return (
    <View style={styles.sections}>
      {loadError ? (
        <Text style={[styles.errorText, { color: Brand.primary }]}>
          {loadError}
        </Text>
      ) : null}

      <Text style={[styles.sectionLabel, { color: textColor }]}>
        Momenten ({momentsCount})
      </Text>
      {momentsCount === 0 ? (
        <Text style={[styles.emptyText, { color: muted }]}>
          Nog geen momenten {labelWord}.
        </Text>
      ) : (
        <View style={styles.momentList}>
          {votedMoments.map((moment, index) => {
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
        Discussies ({votedThreads.length})
      </Text>
      {votedThreads.length === 0 ? (
        <Text style={[styles.emptyText, { color: muted }]}>
          Nog geen discussies {labelWord}.
        </Text>
      ) : (
        <View style={styles.threadList}>
          {votedThreads.map((thread, index) => {
            const palette = getMomentCardColors(index);
            const preview =
              thread.body.length > 160
                ? `${thread.body.slice(0, 157).trimEnd()}...`
                : thread.body;
            return (
              <View
                key={thread.id}
                style={[styles.threadCard, { backgroundColor: palette.bg }]}
              >
                <Text
                  style={[styles.threadTitle, { color: palette.text }]}
                  numberOfLines={2}
                >
                  {thread.title}
                </Text>
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
  threadTitle: {
    fontFamily: FontFamily.titleBold,
    fontSize: 17,
    lineHeight: 22,
    marginBottom: 6,
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

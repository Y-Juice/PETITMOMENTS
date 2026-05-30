import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'

import { VoteWidget } from '@/components/vote-widget'
import { ContentWarningBadge, ContentWarningGate } from '@/components/content-warning-gate'
import { ReportContentButton } from '@/components/report-content-button'
import { hasContentWarning } from '@/data/moderation'
import type { ThreadItem } from '@/contexts/threads-context'
import { useSaves } from '@/contexts/saves-context'
import { useThreadDetailOverlay } from '@/contexts/thread-detail-overlay-context'
import { useVotes } from '@/contexts/votes-context'
import { Brand } from '@/constants/theme'
import { FontFamily } from '@/constants/typography'
import { useThemeColor } from '@/hooks/use-theme-color'

type Props = {
  thread: ThreadItem
}

export function ThreadRow({ thread }: Props) {
  const textColor = useThemeColor({}, 'text')
  const muted = useThemeColor({}, 'icon')
  const cardBg = useThemeColor(
    { light: 'rgba(196, 69, 54, 0.06)', dark: 'rgba(196, 69, 54, 0.14)' },
    'background',
  )
  const { isThreadSaved, toggleThreadSave } = useSaves()
  const { threadSummary, myThreadVote, voteOnThread } = useVotes()
  const { presentThreadById } = useThreadDetailOverlay()
  const [busy, setBusy] = useState(false)
  const saved = isThreadSaved(thread.id)
  const summary = threadSummary(thread.id)
  const myVote = myThreadVote(thread.id)

  const preview =
    thread.body.length > 140 ? `${thread.body.slice(0, 137).trimEnd()}...` : thread.body

  const onPressSave = async () => {
    if (busy) return
    setBusy(true)
    await toggleThreadSave(thread.id)
    setBusy(false)
  }

  return (
    <Pressable
      onPress={() => presentThreadById(thread.id)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: cardBg },
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Open discussie ${thread.title}`}>
      <View style={styles.accent} />

      <View style={styles.tagRow}>
        <MaterialIcons name="timeline" size={15} color={Brand.primary} />
        <Text style={styles.tagText}>
          Rode draad{thread.momentIds?.length ? ` · ${thread.momentIds.length} momenten` : ''}
        </Text>
      </View>

      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: textColor }]} numberOfLines={2}>
          {thread.title}
        </Text>
        <View style={styles.headerActions}>
          <ReportContentButton
            targetType="thread"
            targetId={thread.id}
            targetLabel={thread.title}
          />
          <Pressable
            onPress={() => void onPressSave()}
            disabled={busy}
            style={({ pressed }) => [
              styles.saveBtn,
              saved && styles.saveBtnActive,
              pressed && styles.saveBtnPressed,
              busy && styles.saveBtnDisabled,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: saved }}
            accessibilityLabel={
              saved ? 'Verwijder uit opgeslagen discussies' : 'Bewaar deze discussie'
            }>
            {busy ? (
              <ActivityIndicator size="small" color={saved ? '#FFFFFF' : Brand.primary} />
            ) : (
              <MaterialIcons
                name={saved ? 'bookmark' : 'bookmark-border'}
                size={20}
                color={saved ? '#FFFFFF' : Brand.primary}
              />
            )}
          </Pressable>
        </View>
      </View>

      {hasContentWarning(thread) ? (
        <ContentWarningBadge labels={thread.contentWarning} />
      ) : null}

      {preview ? (
        hasContentWarning(thread) ? (
          <ContentWarningGate item={thread}>
            <Text style={[styles.body, { color: muted }]} numberOfLines={3}>
              {preview}
            </Text>
          </ContentWarningGate>
        ) : (
          <Text style={[styles.body, { color: muted }]} numberOfLines={3}>
            {preview}
          </Text>
        )
      ) : null}

      <View style={styles.footerRow}>
        <VoteWidget
          score={summary.score}
          myVote={myVote}
          onUp={() => void voteOnThread(thread.id, 'up')}
          onDown={() => void voteOnThread(thread.id, 'down')}
          size="compact"
          baseColor={textColor}
        />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingLeft: 20,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(196, 69, 54, 0.25)',
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.9,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: Brand.primary,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  tagText: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    fontWeight: '700',
    color: Brand.primary,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 6,
  },
  title: {
    flex: 1,
    fontFamily: FontFamily.titleBold,
    fontSize: 17,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  saveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Brand.primary,
    backgroundColor: 'transparent',
  },
  saveBtnActive: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  saveBtnPressed: {
    opacity: 0.85,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  body: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 20,
  },
  footerRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
})

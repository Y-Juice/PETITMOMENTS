import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'

import { VoteWidget } from '@/components/vote-widget'
import { ContentWarningBadge, ContentWarningGate } from '@/components/content-warning-gate'
import { ReportContentButton } from '@/components/report-content-button'
import { hasContentWarning } from '@/data/moderation'
import type { ThreadItem } from '@/contexts/threads-context'
import { useSaves } from '@/contexts/saves-context'
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
  const { isThreadSaved, toggleThreadSave } = useSaves()
  const { threadSummary, myThreadVote, voteOnThread } = useVotes()
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
    <View style={styles.wrap}>
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

      {thread.momentIds?.length ? (
        <Text style={[styles.meta, { color: muted }]}>
          Route: {thread.momentIds.length} momenten
        </Text>
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
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: 'rgba(107, 124, 110, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    backgroundColor: 'rgba(107, 124, 110, 0.06)',
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
    fontSize: 16,
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
  meta: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    marginBottom: 6,
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

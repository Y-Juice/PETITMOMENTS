import { StyleSheet, Text, View } from 'react-native'

import type { ThreadItem } from '@/contexts/threads-context'
import { FontFamily } from '@/constants/typography'
import { useThemeColor } from '@/hooks/use-theme-color'

type Props = {
  thread: ThreadItem
}

export function ThreadRow({ thread }: Props) {
  const textColor = useThemeColor({}, 'text')
  const muted = useThemeColor({}, 'icon')
  const preview =
    thread.body.length > 140 ? `${thread.body.slice(0, 137).trimEnd()}...` : thread.body

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: textColor }]} numberOfLines={2}>
        {thread.title}
      </Text>
      {preview ? (
        <Text style={[styles.body, { color: muted }]} numberOfLines={3}>
          {preview}
        </Text>
      ) : null}
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
  title: {
    fontFamily: FontFamily.titleBold,
    fontSize: 16,
    marginBottom: 6,
  },
  body: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 20,
  },
})

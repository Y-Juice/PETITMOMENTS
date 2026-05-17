import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SavedItemsList } from '@/components/saved-items-list';
import { FontFamily } from '@/constants/typography';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function LibraryScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const muted = useThemeColor({}, 'icon');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: textColor }]}>Bibliotheek</Text>
        <Text style={[styles.subtitle, { color: muted }]}>
          Alle momenten en discussies die je hebt opgeslagen.
        </Text>
        <SavedItemsList />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  title: {
    fontFamily: FontFamily.titleBold,
    fontSize: 26,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
});

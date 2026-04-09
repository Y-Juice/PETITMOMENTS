import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FontFamily } from '@/constants/typography';
import { MapPlaceholder } from '@/components/map-placeholder';
import { MomentCard } from '@/components/moment-card';
import { MOCK_MOMENTS } from '@/data/mockMoments';

const ACCENT = '#E54D3D';

export default function HomeScreen() {
  const count = MOCK_MOMENTS.length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.logoPetit}>petit</Text>
          <Text style={styles.logoHome}>home</Text>
        </View>

        <MapPlaceholder />

        <View style={styles.listWrap}>
          {MOCK_MOMENTS.map((moment, index) => {
            const position =
              count === 1 ? 'single' : index === 0 ? 'first' : index === count - 1 ? 'last' : 'middle';
            return <MomentCard key={moment.id} moment={moment} position={position} />;
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  logoPetit: {
    fontFamily: FontFamily.titleBold,
    fontSize: 32,
    lineHeight: 36,
    color: ACCENT,
    letterSpacing: -0.5,
  },
  logoHome: {
    fontFamily: FontFamily.titleBold,
    fontSize: 32,
    lineHeight: 36,
    color: ACCENT,
    letterSpacing: -0.5,
  },
  listWrap: {
    marginHorizontal: 16,
  },
});

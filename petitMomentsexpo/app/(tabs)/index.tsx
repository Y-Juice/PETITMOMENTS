import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import HomeMapPreview from '@/components/home-map-preview';
import { FontFamily } from '@/constants/typography';
import { MomentCard } from '@/components/moment-card';
import { Brand } from '@/constants/theme';
import { MOCK_MOMENTS } from '@/data/mockMoments';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function HomeScreen() {
  const count = MOCK_MOMENTS.length;
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }]} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.logoPetit, { color: Brand.primary }]}>petit</Text>
          <Text style={[styles.logoHome, { color: Brand.primary }]}>moments</Text>
        </View>

        <HomeMapPreview />

        <View style={styles.listWrap}>
          {MOCK_MOMENTS.map((moment, index) => {
            const position =
              count === 1 ? 'single' : index === 0 ? 'first' : index === count - 1 ? 'last' : 'middle';
            return (
              <MomentCard key={moment.id} moment={moment} colorIndex={index} position={position} />
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
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
    letterSpacing: -0.5,
  },
  logoHome: {
    fontFamily: FontFamily.titleBold,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.5,
    marginTop: '-2%',
    marginLeft: '4%',
  },
  listWrap: {
    paddingTop: 50,
    marginHorizontal: 16,
  },
});

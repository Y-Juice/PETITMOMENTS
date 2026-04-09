import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FontFamily } from '@/constants/typography';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function MapScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const muted = useThemeColor({}, 'icon');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }]} edges={['top']}>
      <View style={styles.center}>
        <Text style={[styles.title, { color: textColor }]}>Kaart</Text>
        <Text style={[styles.sub, { color: muted }]}>Interactieve kaart volgt later.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontFamily: FontFamily.titleBold, fontSize: 20, marginBottom: 8 },
  sub: { fontFamily: FontFamily.body, fontSize: 15, textAlign: 'center' },
});

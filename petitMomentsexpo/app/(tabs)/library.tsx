import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FontFamily } from '@/constants/typography';

export default function LibraryScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.center}>
        <Text style={styles.title}>Bibliotheek</Text>
        <Text style={styles.sub}>Je opgeslagen momenten verschijnen hier.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontFamily: FontFamily.titleBold, fontSize: 20, marginBottom: 8 },
  sub: { fontFamily: FontFamily.body, fontSize: 15, color: '#687076', textAlign: 'center' },
});

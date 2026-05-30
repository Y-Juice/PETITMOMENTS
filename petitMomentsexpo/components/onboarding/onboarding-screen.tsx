import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  GradientPrimaryButton,
  PetitMomentLogoBlock,
} from '@/components/auth/auth-screen-shared';
import { Brand, getMomentCardColors } from '@/constants/theme';
import { FontFamily } from '@/constants/typography';
import { useOnboarding } from '@/contexts/onboarding-context';

type Slide = {
  id: string;
  title: string;
  body: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  colorIndex: number;
  showLogo?: boolean;
};

const SLIDES: Slide[] = [
  {
    id: 'welcome',
    title: 'Kleine momenten,\n grote plekken',
    body: 'Petit Moments verbindt persoonlijke verhalen met de kaart van je buurt.',
    icon: 'favorite-border',
    colorIndex: 1,
    showLogo: true,
  },
  {
    id: 'share',
    title: 'Deel je verhaal',
    body: 'Leg een foto en herinnering vast op de plek waar het gebeurde.',
    icon: 'add-a-photo',
    colorIndex: 0,
  },
  {
    id: 'discover',
    title: 'Ontdek in de buurt',
    body: 'Bekijk momenten dichtbij, stem en bewaar wat je raakt.',
    icon: 'near-me',
    colorIndex: 3,
  },
  {
    id: 'thread',
    title: 'Rode draad & discussies',
    body: 'Verbind momenten met een route op de kaart en start een discussie.',
    icon: 'timeline',
    colorIndex: 4,
  },
];

type OnboardingScreenProps = {
  onDone?: () => void;
};

export function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const isLast = index >= SLIDES.length - 1;

  const finish = async () => {
    if (finishing) return;
    setFinishing(true);
    await completeOnboarding();
    onDone?.();
    router.replace('/login');
    setFinishing(false);
  };

  const onNext = () => {
    if (isLast) {
      void finish();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    if (nextIndex !== index) setIndex(nextIndex);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => void finish()}
          disabled={finishing}
          style={({ pressed }) => [styles.skipBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Onboarding overslaan">
          <Text style={styles.skipText}>Overslaan</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        style={styles.list}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={false}
        renderItem={({ item }) => {
          const palette = getMomentCardColors(item.colorIndex);
          return (
            <View style={[styles.slide, { width, backgroundColor: palette.bg }]}>
              <View style={styles.slideInner}>
                {item.showLogo ? (
                  <View style={styles.logoWrap}>
                    <PetitMomentLogoBlock />
                  </View>
                ) : (
                  <View style={styles.iconCircle}>
                    <MaterialIcons name={item.icon} size={34} color={palette.text} />
                  </View>
                )}

                <Text style={[styles.title, { color: palette.text }]}>{item.title}</Text>
                <Text style={[styles.body, { color: palette.sub }]}>{item.body}</Text>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((slide, dotIndex) => (
            <View
              key={slide.id}
              style={[
                styles.dot,
                dotIndex === index ? styles.dotActive : styles.dotIdle,
              ]}
            />
          ))}
        </View>

        <GradientPrimaryButton
          label={finishing ? 'Bezig…' : isLast ? 'Aan de slag' : 'Volgende'}
          onPress={onNext}
          loading={finishing}
          disabled={finishing}
        />

        <Text style={styles.stepHint}>
          {index + 1} / {SLIDES.length}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Brand.primary,
  },
  list: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    paddingHorizontal: 8,
  },
  skipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  skipText: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
  },
  slideInner: {
    paddingHorizontal: 28,
    paddingTop: 48,
    paddingBottom: 24,
  },
  logoWrap: {
    marginBottom: 28,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    marginBottom: 28,
  },
  title: {
    fontFamily: FontFamily.titleBold,
    fontSize: 32,
    lineHeight: 38,
    marginBottom: 14,
  },
  body: {
    fontFamily: FontFamily.body,
    fontSize: 17,
    lineHeight: 25,
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dot: {
    height: 8,
    borderRadius: 999,
  },
  dotActive: {
    width: 22,
    backgroundColor: Brand.primary,
  },
  dotIdle: {
    width: 8,
    backgroundColor: 'rgba(107, 124, 110, 0.35)',
  },
  stepHint: {
    marginTop: 10,
    textAlign: 'center',
    fontFamily: FontFamily.body,
    fontSize: 12,
    color: Brand.neutral,
  },
  pressed: {
    opacity: 0.88,
  },
});

import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

type RevealProps = {
  children: ReactNode;
  /** Volgorde in een lijst: zorgt voor een licht getrapt effect. */
  index?: number;
  /** Extra vertraging in ms bovenop de index. */
  delay?: number;
  style?: StyleProp<ViewStyle>;
};

const STAGGER_MS = 55;
const MAX_STAGGER_STEPS = 8;
const DURATION_MS = 320;

/**
 * Subtiele "fade + omhoog" animatie wanneer een element voor het eerst verschijnt
 * (bijv. terwijl je door de feed scrolt). Puur cosmetisch.
 */
export function Reveal({ children, index = 0, delay = 0, style }: RevealProps) {
  const steps = Math.min(index, MAX_STAGGER_STEPS);
  const entering = FadeInDown.duration(DURATION_MS)
    .delay(delay + steps * STAGGER_MS)
    .withInitialValues({ transform: [{ translateY: 12 }] });

  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}

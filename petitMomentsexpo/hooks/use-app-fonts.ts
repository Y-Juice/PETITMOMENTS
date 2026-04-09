import {
  Fraunces_400Regular,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import { useFonts } from 'expo-font';

export function useAppFonts() {
  return useFonts({
    Fraunces_400Regular,
    Fraunces_700Bold,
    'GlacialIndifference-Regular': require('@/assets/fonts/GlacialIndifference-Regular.otf'),
  });
}

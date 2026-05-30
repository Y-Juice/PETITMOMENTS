import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'petitmoments_onboarding_completed_v1';

export async function readOnboardingCompleted(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    return value === '1';
  } catch {
    return false;
  }
}

export async function writeOnboardingCompleted(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, '1');
}

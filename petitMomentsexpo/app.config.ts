import path from 'node:path';

import type { ConfigContext, ExpoConfig } from 'expo/config';

require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({
  path: path.resolve(__dirname, '.env.local'),
  override: true,
});

export default ({ config }: ConfigContext): ExpoConfig => {
  const googleMapsKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY ?? process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  const merged = {
    ...config,
    extra: {
      ...(config.extra ?? {}),
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_KEY,
    },
  };

  if (googleMapsKey) {
    merged.android = {
      ...(config.android ?? {}),
      config: {
        ...((config.android as { config?: Record<string, unknown> } | undefined)?.config ?? {}),
        googleMaps: { apiKey: googleMapsKey },
      },
    };
  }

  return merged as ExpoConfig;
};

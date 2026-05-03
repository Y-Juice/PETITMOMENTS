import path from 'node:path';

import type { ConfigContext, ExpoConfig } from 'expo/config';

require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({
  path: path.resolve(__dirname, '.env.local'),
  override: true,
});

export default ({ config }: ConfigContext): ExpoConfig =>
  ({
    ...config,
    extra: {
      ...(config.extra ?? {}),
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_KEY,
    },
  }) as ExpoConfig;

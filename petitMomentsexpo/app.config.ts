import path from "node:path";

import type { ConfigContext, ExpoConfig } from "expo/config";

require("dotenv").config({ path: path.resolve(__dirname, ".env") });
require("dotenv").config({
  path: path.resolve(__dirname, ".env.local"),
  override: true,
});

type AppExtra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  adminEmails?: string;
  orsApiKey?: string;
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const extra = (config.extra ?? {}) as AppExtra;

  const googleMapsKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY ??
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  const merged = {
    ...config,
    extra: {
      ...extra,
      supabaseUrl:
        process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra.supabaseUrl ?? "",
      supabaseAnonKey:
        process.env.EXPO_PUBLIC_SUPABASE_KEY ?? extra.supabaseAnonKey ?? "",
      adminEmails:
        process.env.EXPO_PUBLIC_ADMIN_EMAILS ?? extra.adminEmails ?? "",
      orsApiKey:
        process.env.EXPO_PUBLIC_ORS_API_KEY ?? extra.orsApiKey ?? "",
    },
  };

  if (googleMapsKey) {
    merged.android = {
      ...(config.android ?? {}),
      config: {
        ...((config.android as { config?: Record<string, unknown> } | undefined)
          ?.config ?? {}),
        googleMaps: { apiKey: googleMapsKey },
      },
    };
  }

  return merged as ExpoConfig;
};

# Petit Moments

Cross-platform mobile app that connects personal stories to places on a map. Users share **moments** (a photo and short text pinned to a location) and discover what happened nearby. **Rode draden** (threads) link multiple moments into a walkable or bikeable route through a neighbourhood.

**Baseline:** _Kleine momenten, grote verhalen._

## Features

- **Moments** — Upload a photo, write a story, and pin it to an address or map coordinate (public or private).
- **Proximity feed** — Home screen lists nearby moments sorted by distance from the user.
- **Map** — Browse all moments, compose routes, and follow directions to a moment or thread.
- **Rode draden** — Select moments in order on the map to create a shared route; view numbered stops and rope-style paths.
- **Route guidance** — Live location tracking, compass bearing, and walking/cycling routes via OpenRouteService (with straight-line fallback).
- **Voting & saves** — Upvote/downvote moments and threads; bookmark items in the library.
- **Authentication** — Email/password sign-up and login through Supabase Auth.
- **Moderation** — Report content; admin dashboard to review reports and manage visibility.
- **Onboarding** — First-run walkthrough of the app concept.
- **Theming** — Light and dark mode with brand colours and custom typography (Fraunces, Glacial Indifference).

## Tech stack

| Layer         | Technology                                                                       |
| ------------- | -------------------------------------------------------------------------------- |
| Framework     | [Expo SDK 54](https://docs.expo.dev/) + [React Native](https://reactnative.dev/) |
| Language      | [TypeScript](https://www.typescriptlang.org/)                                    |
| Routing       | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based)           |
| Backend       | [Supabase](https://supabase.com/docs) (PostgreSQL, Auth, Storage, RLS)           |
| Maps          | [react-native-maps](https://github.com/react-native-maps/react-native-maps)      |
| Location      | [expo-location](https://docs.expo.dev/versions/latest/sdk/location/)             |
| Routing API   | [OpenRouteService](https://openrouteservice.org/)                                |
| Navigation UI | [React Navigation](https://reactnavigation.org/)                                 |
| Builds        | [EAS Build](https://docs.expo.dev/build/introduction/)                           |

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- npm
- A [Supabase](https://supabase.com/) project with the required tables and policies
- (Optional) [OpenRouteService API key](https://openrouteservice.org/dev/#/signup) for street-level route guidance
- (Optional) [Google Maps API key](https://developers.google.com/maps/documentation/android-sdk/get-api-key) for maps in standalone Android builds
- [Expo Go](https://expo.dev/go) on a device, or Android Studio / Xcode for emulators

## Installation

1. Clone the repository and open the project folder:

   ```bash
   git clone <repository-url>
   cd petitMomentsexpo
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root (see [Environment variables](#environment-variables)).

4. Start the development server:

   ```bash
   npm start
   ```

   Press `a` for Android, `i` for iOS, or `w` for web. You can also scan the QR code with Expo Go.

## Environment variables

Create `.env` in the project root. Values are loaded by `app.config.ts` and exposed to the app via `expo-constants` `extra` as a fallback for production builds.

| Variable                              | Required | Description                                               |
| ------------------------------------- | -------- | --------------------------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`            | Yes      | Supabase project URL                                      |
| `EXPO_PUBLIC_SUPABASE_KEY`            | Yes      | Supabase anon/public key                                  |
| `EXPO_PUBLIC_ORS_API_KEY`             | No       | OpenRouteService API key for walking/cycling routes       |
| `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY` | No       | Google Maps SDK key for Android release builds            |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`     | No       | Alternative env name for the Google Maps key              |
| `EXPO_PUBLIC_ADMIN_EMAILS`            | No       | Comma-separated admin emails for the moderation dashboard |

Example:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your-anon-key
EXPO_PUBLIC_ORS_API_KEY=your-ors-key
EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY=your-google-maps-key
EXPO_PUBLIC_ADMIN_EMAILS=admin@example.com
```

Do not commit `.env` or other files containing secrets.

After changing environment variables, restart the Expo dev server.

## Scripts

| Command           | Description                        |
| ----------------- | ---------------------------------- |
| `npm start`       | Start the Expo development server  |
| `npm run android` | Start Expo and open on Android     |
| `npm run ios`     | Start Expo and open on iOS         |
| `npm run web`     | Start Expo and open in the browser |
| `npm run lint`    | Run ESLint                         |

## Building for Android (APK)

This project uses [EAS Build](https://docs.expo.dev/build/setup/). The `preview` profile in `eas.json` produces an installable APK.

1. Install the EAS CLI and log in:

   ```bash
   npm install -g eas-cli
   eas login
   ```

2. Run a preview build:

   ```bash
   eas build -p android --profile preview
   ```

3. Download the APK from the build page on [expo.dev](https://expo.dev) when the build completes.

For production releases, use the `production` profile. See the [EAS Build documentation](https://docs.expo.dev/build/introduction/) for details.

## Project structure

```
petitMomentsexpo/
├── app/                    # Expo Router screens and layouts
│   ├── (auth)/             # Login and registration
│   ├── (tabs)/             # Main tab navigation (Home, Map, Add, Library, Profile)
│   ├── admin/              # Moderation dashboard
│   └── onboarding.tsx      # First-run onboarding
├── components/             # Reusable UI components
├── contexts/               # React context providers (auth, moments, votes, …)
├── constants/              # Theme, typography, colours
├── data/                   # Shared types and static data
├── hooks/                  # Custom React hooks
├── utils/                  # Supabase clients, routing, geo helpers
├── assets/images/          # App icons (icon, iconDark, iconRed, iconRednoBG, …)
├── stubs/                  # Web stubs for react-native-maps
├── app.config.ts           # Dynamic Expo config and env loading
├── app.json                # Static Expo config
└── eas.json                # EAS Build profiles
```

Platform-specific screens use Expo’s convention: `.native.tsx` for iOS/Android and `.web.tsx` for web (for example `add.native.tsx` and `map.native.tsx`).

## Supabase

The app expects Supabase tables including (among others):

- `profiles`
- `moments`
- `threads` and `thread_moments`
- `votes`
- `saves`
- `reports`

Row Level Security (RLS) policies must allow authenticated users to read public content and manage their own data. See the [Supabase JavaScript client documentation](https://supabase.com/docs/reference/javascript/introduction) and [Auth guides](https://supabase.com/docs/guides/auth).

## Maps on web vs native

On native platforms, maps use `react-native-maps`. On web, Metro resolves map imports to lightweight stubs in `stubs/` so the app can run without native map modules. Full map functionality is intended for iOS and Android.

## Linting

The project uses [ESLint](https://eslint.org/) with [`eslint-config-expo`](https://www.npmjs.com/package/eslint-config-expo):

```bash
npm run lint
```

## Sources and documentation

Technologies and APIs used in this project:

- **Expo** — [Documentation](https://docs.expo.dev/)
- **Expo Router** — [File-based routing](https://docs.expo.dev/router/introduction/)
- **React** — [react.dev](https://react.dev/)
- **React Native** — [reactnative.dev](https://reactnative.dev/)
- **TypeScript** — [typescriptlang.org](https://www.typescriptlang.org/docs/)
- **Supabase** — [JavaScript client](https://supabase.com/docs/reference/javascript/introduction), [Auth](https://supabase.com/docs/guides/auth), [Storage](https://supabase.com/docs/guides/storage)
- **react-native-maps** — [GitHub repository](https://github.com/react-native-maps/react-native-maps)
- **expo-location** — [SDK reference](https://docs.expo.dev/versions/latest/sdk/location/)
- **expo-image-picker** — [SDK reference](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- **expo-image** — [SDK reference](https://docs.expo.dev/versions/latest/sdk/image/)
- **OpenRouteService** — [API documentation](https://openrouteservice.org/dev/#/api-docs)
- **Google Maps Platform** — [Maps SDK for Android](https://developers.google.com/maps/documentation/android-sdk/overview)
- **React Navigation** — [Documentation](https://reactnavigation.org/docs/getting-started/)
- **Async Storage** — [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/docs/install/)
- **EAS Build** — [Expo Application Services](https://docs.expo.dev/build/introduction/)
- **Expo Fonts / Google Fonts** — [@expo-google-fonts/fraunces](https://www.npmjs.com/package/@expo-google-fonts/fraunces)
- **OpenAI.** (2026, 5 juni). _ChatGPT-conversatie over Expo en Supabase integratie_ (Versie ChatGPT-4o) [Chatlog]. Geraadpleegd in april - juni 2026, van https://chatgpt.com/share/6a2205cc-3a2c-8325-9f84-bd946b9be0b0

## License

Private project — all rights reserved unless stated otherwise.

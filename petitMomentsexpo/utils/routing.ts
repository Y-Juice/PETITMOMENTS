import Constants from "expo-constants";

import type { LatLng } from "@/utils/moments-map-region";

/** Reisprofielen die we ondersteunen (te voet of met de fiets). */
export type RouteProfile = "foot-walking" | "cycling-regular";

export type PlannedRoute = {
  coordinates: LatLng[];
  distanceMeters: number;
  durationSeconds: number;
};

type ExpoExtra = {
  orsApiKey?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;

/** Sleutel komt uit .env (EXPO_PUBLIC_ORS_API_KEY) of uit app.config extra. */
const ORS_API_KEY = process.env.EXPO_PUBLIC_ORS_API_KEY ?? extra.orsApiKey ?? "";

/** Is er een routing-sleutel ingesteld? Zo niet, dan vallen we terug op een rechte lijn. */
export function hasRoutingKey(): boolean {
  return Boolean(ORS_API_KEY);
}

type OrsFeature = {
  geometry?: { coordinates?: [number, number][] };
  properties?: { summary?: { distance?: number; duration?: number } };
};

type OrsResponse = {
  features?: OrsFeature[];
};

/**
 * Vraagt een echte straatroute op bij OpenRouteService tussen twee punten.
 * Geeft null terug als er geen sleutel is of geen route gevonden wordt.
 */
export async function fetchRoute(
  from: LatLng,
  to: LatLng,
  profile: RouteProfile,
): Promise<PlannedRoute | null> {
  if (!ORS_API_KEY) return null;

  const url = `https://api.openrouteservice.org/v2/directions/${profile}/geojson`;
  const body = {
    coordinates: [
      [from.longitude, from.latitude],
      [to.longitude, to.latitude],
    ],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: ORS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Route kon niet berekend worden (${response.status}).`);
  }

  const data = (await response.json()) as OrsResponse;
  const feature = data.features?.[0];
  const coordinates = feature?.geometry?.coordinates;
  const summary = feature?.properties?.summary;

  if (!coordinates || coordinates.length < 2) {
    return null;
  }

  return {
    coordinates: coordinates.map(([lng, lat]) => ({
      latitude: lat,
      longitude: lng,
    })),
    distanceMeters: summary?.distance ?? 0,
    durationSeconds: summary?.duration ?? 0,
  };
}

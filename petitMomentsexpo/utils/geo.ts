import type { LatLng } from "@/utils/moments-map-region";

const EARTH_RADIUS_M = 6371000;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function toDegrees(value: number): number {
  return (value * 180) / Math.PI;
}

/** Afstand in meters tussen twee punten (haversine, hemelsbreed). */
export function distanceMeters(from: LatLng, to: LatLng): number {
  const latDelta = toRadians(to.latitude - from.latitude);
  const lngDelta = toRadians(to.longitude - from.longitude);
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);

  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(fromLat) *
      Math.cos(toLat) *
      Math.sin(lngDelta / 2) *
      Math.sin(lngDelta / 2);

  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Richting in graden (0 = noord, met de klok mee) van `from` naar `to`. */
export function bearingDegrees(from: LatLng, to: LatLng): number {
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);
  const lngDelta = toRadians(to.longitude - from.longitude);

  const y = Math.sin(lngDelta) * Math.cos(toLat);
  const x =
    Math.cos(fromLat) * Math.sin(toLat) -
    Math.sin(fromLat) * Math.cos(toLat) * Math.cos(lngDelta);

  const bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

/** Korte tekstweergave van een afstand, bv. "850m" of "1.2km". */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.max(1, Math.round(meters))}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/** Korte tekstweergave van een reistijd, bv. "8 min" of "1 u 5 min". */
export function formatDuration(seconds: number): string {
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours} u ${minutes} min` : `${hours} u`;
}

/**
 * Afstand (m) van een punt tot het dichtstbijzijnde punt van een route.
 * Wordt gebruikt om te merken dat de gebruiker van de route is afgeweken.
 */
export function distanceToNearestPoint(point: LatLng, path: LatLng[]): number {
  if (path.length === 0) return Infinity;
  let nearest = Infinity;
  for (const coord of path) {
    const d = distanceMeters(point, coord);
    if (d < nearest) nearest = d;
  }
  return nearest;
}

const COMPASS_LABELS = ["N", "NO", "O", "ZO", "Z", "ZW", "W", "NW"];

/** Windrichting (N, NO, O, ...) op basis van een hoek in graden. */
export function compassLabel(bearing: number): string {
  const index = Math.round(bearing / 45) % 8;
  return COMPASS_LABELS[index];
}

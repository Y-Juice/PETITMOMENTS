import type { Moment } from '@/data/mockMoments';

export const BRUSSELS_DELTA = {
  latitudeDelta: 0.035,
  longitudeDelta: 0.035,
} as const;

export type LatLng = {
  latitude: number;
  longitude: number;
};

export type MomentsMapRegion = LatLng & {
  latitudeDelta: number;
  longitudeDelta: number;
};

export function getMomentCoordinates(moments: Moment[]): LatLng[] {
  return moments.map((m) => ({
    latitude: m.location.latitude,
    longitude: m.location.longitude,
  }));
}

export function getInitialRegionForCoordinates(coords: LatLng[]): MomentsMapRegion {
  if (coords.length === 0) {
    return {
      latitude: 50.8503,
      longitude: 4.3517,
      ...BRUSSELS_DELTA,
    };
  }

  let minLat = coords[0].latitude;
  let maxLat = coords[0].latitude;
  let minLng = coords[0].longitude;
  let maxLng = coords[0].longitude;

  for (const c of coords) {
    minLat = Math.min(minLat, c.latitude);
    maxLat = Math.max(maxLat, c.latitude);
    minLng = Math.min(minLng, c.longitude);
    maxLng = Math.max(maxLng, c.longitude);
  }

  const pad = 0.004;
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(BRUSSELS_DELTA.latitudeDelta, maxLat - minLat + pad * 4),
    longitudeDelta: Math.max(BRUSSELS_DELTA.longitudeDelta, maxLng - minLng + pad * 4),
  };
}

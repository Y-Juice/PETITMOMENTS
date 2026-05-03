import MapView from 'react-native-maps/lib/MapView';
import Marker from 'react-native-maps/lib/MapMarker';
import { useCallback, useMemo, useRef } from 'react';
import type { ComponentRef } from 'react';
import { StyleSheet } from 'react-native';

import { MapPlaceholder } from '@/components/map-placeholder';
import { MapScreenShell } from '@/components/map-screen-shell';
import { MOCK_MOMENTS } from '@/data/mockMoments';

const BRUSSELS_DELTA = {
  latitudeDelta: 0.035,
  longitudeDelta: 0.035,
};

export default function MapScreenNative() {
  const mapRef = useRef<ComponentRef<typeof MapView> | null>(null);

  const coordinates = useMemo(
    () =>
      MOCK_MOMENTS.map((m) => ({
        latitude: m.location.latitude,
        longitude: m.location.longitude,
      })),
    []
  );

  const initialRegion = useMemo(() => {
    if (coordinates.length === 0) {
      return {
        latitude: 50.8503,
        longitude: 4.3517,
        ...BRUSSELS_DELTA,
      };
    }

    let minLat = coordinates[0].latitude;
    let maxLat = coordinates[0].latitude;
    let minLng = coordinates[0].longitude;
    let maxLng = coordinates[0].longitude;

    for (const c of coordinates) {
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
  }, [coordinates]);

  const fitMap = useCallback(() => {
    if (coordinates.length === 0) return;
    mapRef.current?.fitToCoordinates(coordinates, {
      edgePadding: { top: 72, right: 28, bottom: 112, left: 28 },
      animated: true,
    });
  }, [coordinates]);

  if (coordinates.length === 0) {
    return (
      <MapScreenShell>
        <MapPlaceholder />
      </MapScreenShell>
    );
  }

  return (
    <MapScreenShell>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        onMapReady={fitMap}
        mapType="standard"
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}>
        {MOCK_MOMENTS.map((moment) => (
          <Marker
            key={moment.id}
            coordinate={{
              latitude: moment.location.latitude,
              longitude: moment.location.longitude,
            }}
            title={moment.title}
            description={`${moment.username} · ${moment.location.label}`}
            tracksViewChanges={false}
          />
        ))}
      </MapView>
    </MapScreenShell>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

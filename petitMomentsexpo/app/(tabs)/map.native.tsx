import MapView from 'react-native-maps/lib/MapView';
import Marker from 'react-native-maps/lib/MapMarker';
import { useCallback, useMemo, useRef } from 'react';
import type { ComponentRef } from 'react';
import { StyleSheet } from 'react-native';

import { MapPlaceholder } from '@/components/map-placeholder';
import { MapScreenShell } from '@/components/map-screen-shell';
import { useMoments } from '@/contexts/moments-context';
import { getInitialRegionForCoordinates, getMomentCoordinates } from '@/utils/moments-map-region';

export default function MapScreenNative() {
  const mapRef = useRef<ComponentRef<typeof MapView> | null>(null);
  const { moments } = useMoments();

  const coordinates = useMemo(() => getMomentCoordinates(moments), [moments]);
  const initialRegion = useMemo(() => getInitialRegionForCoordinates(coordinates), [coordinates]);

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
        {moments.map((moment) => (
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

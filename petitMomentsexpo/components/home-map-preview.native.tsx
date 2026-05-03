import MapView from 'react-native-maps/lib/MapView';
import Marker from 'react-native-maps/lib/MapMarker';
import { useCallback, useMemo, useRef } from 'react';
import type { ComponentRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { MapPlaceholder } from '@/components/map-placeholder';
import { useMoments } from '@/contexts/moments-context';
import { getInitialRegionForCoordinates, getMomentCoordinates } from '@/utils/moments-map-region';

const PREVIEW_HEIGHT = 220;

export default function HomeMapPreview() {
  const mapRef = useRef<ComponentRef<typeof MapView> | null>(null);
  const { moments } = useMoments();
  const coordinates = useMemo(() => getMomentCoordinates(moments), [moments]);
  const initialRegion = useMemo(() => getInitialRegionForCoordinates(coordinates), [coordinates]);

  const fitMap = useCallback(() => {
    if (coordinates.length === 0) return;
    mapRef.current?.fitToCoordinates(coordinates, {
      edgePadding: { top: 16, right: 12, bottom: 12, left: 12 },
      animated: false,
    });
  }, [coordinates]);

  if (coordinates.length === 0) {
    return <MapPlaceholder />;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.inner}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          onMapReady={fitMap}
          mapType="standard"
          scrollEnabled={false}
          zoomEnabled={false}
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  inner: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#E8E4DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    height: PREVIEW_HEIGHT,
  },
  map: {
    width: '100%',
    height: PREVIEW_HEIGHT,
  },
});

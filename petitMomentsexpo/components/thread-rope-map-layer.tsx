import { useMemo } from 'react';
import Polyline from 'react-native-maps/lib/MapPolyline';

import { Brand } from '@/constants/theme';
import { ThreadNumberedMarker } from '@/components/thread-numbered-marker';
import type { LatLng } from '@/utils/moments-map-region';
import { buildRopePolylineCoordinates } from '@/utils/thread-rope-polyline';

/** Dun rood garen zoals op een detective-prikbord. */
const THREAD_COLOR = Brand.primary;
const THREAD_SHADOW = 'rgba(120, 20, 12, 0.35)';

export type ThreadRouteStop = LatLng & {
  id: string;
  title: string;
  order: number;
};

type ThreadRopeMapLayerProps = {
  waypoints: LatLng[];
  stops?: ThreadRouteStop[];
  onStopPress?: (id: string) => void;
};

export function ThreadRopeMapLayer({
  waypoints,
  stops = [],
  onStopPress,
}: ThreadRopeMapLayerProps) {
  const ropeCoordinates = useMemo(
    () => buildRopePolylineCoordinates(waypoints),
    [waypoints],
  );

  if (ropeCoordinates.length < 2 && stops.length === 0) {
    return null;
  }

  return (
    <>
      {ropeCoordinates.length >= 2 ? (
        <>
          <Polyline
            coordinates={ropeCoordinates}
            strokeColor={THREAD_SHADOW}
            strokeWidth={3}
            lineCap="round"
            lineJoin="round"
          />
          <Polyline
            coordinates={ropeCoordinates}
            strokeColor={THREAD_COLOR}
            strokeWidth={2}
            lineCap="round"
            lineJoin="round"
          />
        </>
      ) : null}

      {stops.map((stop) => (
        <ThreadNumberedMarker
          key={`thread-stop-${stop.id}`}
          coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
          order={stop.order}
          title={stop.title}
          description={`Stap ${stop.order} · draad vastgepind`}
          onPress={onStopPress ? () => onStopPress(stop.id) : undefined}
        />
      ))}
    </>
  );
}

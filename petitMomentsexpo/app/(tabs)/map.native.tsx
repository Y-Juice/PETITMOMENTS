import * as Location from 'expo-location';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MapView from 'react-native-maps/lib/MapView';
import Marker from 'react-native-maps/lib/MapMarker';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { FontFamily } from '@/constants/typography';
import { MapScreenShell } from '@/components/map-screen-shell';
import { useMoments } from '@/contexts/moments-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getInitialRegionForCoordinates, getMomentCoordinates } from '@/utils/moments-map-region';

export default function MapScreenNative() {
  const mapRef = useRef<ComponentRef<typeof MapView> | null>(null);
  const { moments } = useMoments();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const coordinates = useMemo(() => getMomentCoordinates(moments), [moments]);
  const mapCoordinates = useMemo(() => {
    if (!userLocation) return coordinates;
    return [...coordinates, userLocation];
  }, [coordinates, userLocation]);
  const initialRegion = useMemo(() => getInitialRegionForCoordinates(mapCoordinates), [mapCoordinates]);
  const buttonColor = useThemeColor({ light: Brand.primary, dark: Brand.secondary }, 'tint');
  const buttonTextColor = '#FFFFFF';
  const muted = useThemeColor({}, 'icon');

  const fitMap = useCallback(() => {
    if (mapCoordinates.length === 0) return;
    mapRef.current?.fitToCoordinates(mapCoordinates, {
      edgePadding: { top: 72, right: 28, bottom: 112, left: 28 },
      animated: true,
    });
  }, [mapCoordinates]);

  const fetchUserLocation = useCallback(async () => {
    try {
      setIsLocating(true);
      setLocationError('');
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationError('Geef locatie-toegang om je positie op de kaart te tonen.');
        return;
      }
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const next = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
      setUserLocation(next);
      mapRef.current?.animateToRegion(
        {
          ...next,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        },
        450
      );
    } catch {
      setLocationError('Kon je locatie niet ophalen. Probeer opnieuw.');
    } finally {
      setIsLocating(false);
    }
  }, []);

  useEffect(() => {
    void fetchUserLocation();
  }, [fetchUserLocation]);

  return (
    <MapScreenShell>
      <View style={styles.root}>
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
          {userLocation ? (
            <Marker
              coordinate={userLocation}
              title="Jouw locatie"
              description="Huidige positie"
              pinColor="#1F7AE0"
              tracksViewChanges={false}
            />
          ) : null}
        </MapView>

        <View style={styles.controls}>
          <Pressable
            onPress={() => void fetchUserLocation()}
            style={[styles.locationButton, { backgroundColor: buttonColor }, isLocating && styles.locationButtonDisabled]}
            disabled={isLocating}>
            <MaterialIcons name="my-location" size={16} color={buttonTextColor} />
            <Text style={[styles.locationButtonText, { color: buttonTextColor }]}>
              {isLocating ? 'Locatie laden...' : 'Mijn locatie'}
            </Text>
          </Pressable>
          {locationError ? <Text style={[styles.errorText, { color: muted }]}>{locationError}</Text> : null}
        </View>
      </View>
    </MapScreenShell>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 180,
  },
  locationButton: {
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 3,
  },
  locationButtonDisabled: {
    opacity: 0.7,
  },
  locationButtonText: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    marginTop: 6,
    fontFamily: FontFamily.body,
    fontSize: 12,
    lineHeight: 15,
    textAlign: 'right',
  },
});

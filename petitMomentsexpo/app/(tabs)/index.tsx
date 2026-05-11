import * as Location from 'expo-location';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import HomeMapPreview from '@/components/home-map-preview';
import { MomentCard } from '@/components/moment-card';
import { ThreadRow } from '@/components/thread-row';
import { Brand } from '@/constants/theme';
import { FontFamily } from '@/constants/typography';
import { useMomentDetailOverlay } from '@/contexts/moment-detail-overlay-context';
import { useMoments } from '@/contexts/moments-context';
import { useThreads } from '@/contexts/threads-context';
import type { Moment } from '@/data/mockMoments';
import { useThemeColor } from '@/hooks/use-theme-color';

type LatLng = {
  latitude: number;
  longitude: number;
};

function getDistanceMeters(from: LatLng, to: LatLng): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const latDelta = toRadians(to.latitude - from.latitude);
  const lngDelta = toRadians(to.longitude - from.longitude);
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);

  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lngDelta / 2) * Math.sin(lngDelta / 2);

  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.max(1, Math.round(meters))}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export default function HomeScreen() {
  const { presentMomentById } = useMomentDetailOverlay();
  const { moments, loading, loadError, refreshMoments } = useMoments();
  const {
    threads,
    loading: threadsLoading,
    loadError: threadsLoadError,
    refreshThreads,
  } = useThreads();
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const muted = useThemeColor({}, 'icon');

  useEffect(() => {
    let cancelled = false;

    const loadUserLocation = async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) return;
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        setUserLocation({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        });
      } catch {
        // Proximity feed falls back to upload order when location is unavailable.
      }
    };

    void loadUserLocation();

    return () => {
      cancelled = true;
    };
  }, []);

  const proximityFeed = useMemo(() => {
    if (!userLocation) return moments;
    return [...moments].sort((a, b) => {
      const distanceA = getDistanceMeters(userLocation, a.location);
      const distanceB = getDistanceMeters(userLocation, b.location);
      return distanceA - distanceB;
    });
  }, [moments, userLocation]);

  const displayFeed = useMemo<Moment[]>(() => {
    if (!userLocation) return proximityFeed;
    return proximityFeed.map((moment) => {
      const distance = getDistanceMeters(userLocation, moment.location);
      return {
        ...moment,
        location: {
          ...moment.location,
          label: formatDistance(distance),
        },
      };
    });
  }, [proximityFeed, userLocation]);

  const count = displayFeed.length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }]} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.logoPetit, { color: Brand.primary }]}>petit</Text>
          <Text style={[styles.logoHome, { color: Brand.primary }]}>moments</Text>
        </View>

        <HomeMapPreview />

        {threadsLoadError ? (
          <View style={[styles.errorBanner, { borderColor: Brand.neutral }]}>
            <Text style={[styles.errorText, { color: textColor }]}>{threadsLoadError}</Text>
            <Pressable style={styles.retryBtn} onPress={refreshThreads}>
              <Text style={styles.retryBtnText}>Opnieuw laden</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.segment}>
          <Text style={[styles.segmentTitle, { color: textColor }]}>Discussies</Text>
          {threadsLoading ? (
            <View style={styles.segmentState}>
              <Text style={[styles.stateText, { color: muted }]}>Discussies laden...</Text>
            </View>
          ) : threads.length === 0 ? (
            <View style={styles.segmentState}>
              <Text style={[styles.stateText, { color: muted }]}>Nog geen discussies.</Text>
            </View>
          ) : (
            <View style={styles.threadList}>
              {threads.map((thread) => (
                <ThreadRow key={thread.id} thread={thread} />
              ))}
            </View>
          )}
        </View>

        {loadError ? (
          <View style={[styles.errorBanner, { borderColor: Brand.neutral }]}>
            <Text style={[styles.errorText, { color: textColor }]}>{loadError}</Text>
            <Pressable style={styles.retryBtn} onPress={refreshMoments}>
              <Text style={styles.retryBtnText}>Opnieuw laden</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.segment}>
          <Text style={[styles.segmentTitle, { color: textColor }]}>Momenten</Text>
          {loading ? (
            <View style={styles.segmentState}>
              <Text style={[styles.stateText, { color: muted }]}>Momenten laden...</Text>
            </View>
          ) : count === 0 ? (
            <View style={styles.segmentState}>
              <Text style={[styles.stateTitle, { color: textColor }]}>Nog geen momenten</Text>
              <Text style={[styles.stateText, { color: muted }]}>
                Upload je eerste moment om je proximity feed op te bouwen.
              </Text>
            </View>
          ) : (
            <View style={styles.listWrap}>
              {displayFeed.map((moment, index) => {
                const position =
                  count === 1 ? 'single' : index === 0 ? 'first' : index === count - 1 ? 'last' : 'middle';
                return (
                  <MomentCard
                    key={moment.id}
                    moment={moment}
                    colorIndex={index}
                    position={position}
                    onPress={() => presentMomentById(moment.id)}
                  />
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  logoPetit: {
    fontFamily: FontFamily.titleBold,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  logoHome: {
    fontFamily: FontFamily.titleBold,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.5,
    marginTop: '-2%',
    marginLeft: '4%',
  },
  listWrap: {
    paddingTop: 50,
    marginHorizontal: 0,
  },
  segment: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  segmentTitle: {
    fontFamily: FontFamily.titleBold,
    fontSize: 20,
    marginBottom: 12,
  },
  segmentState: {
    paddingVertical: 8,
  },
  threadList: {
    paddingBottom: 8,
  },
  stateTitle: {
    fontFamily: FontFamily.titleBold,
    fontSize: 20,
    marginBottom: 8,
  },
  stateText: {
    fontFamily: FontFamily.body,
    fontSize: 15,
    lineHeight: 21,
  },
  errorBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(107, 124, 110, 0.08)',
  },
  errorText: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Brand.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.body,
    fontSize: 13,
    fontWeight: '700',
  },
});

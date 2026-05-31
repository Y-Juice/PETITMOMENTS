import * as Location from "expo-location";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import HomeMapPreview from "@/components/home-map-preview";
import { MomentCard } from "@/components/moment-card";
import { ThreadCard } from "@/components/thread-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Reveal } from "@/components/ui/reveal";
import { Brand } from "@/constants/theme";
import { FontFamily } from "@/constants/typography";
import { useAuth } from "@/contexts/auth-context";
import { useMomentDetailOverlay } from "@/contexts/moment-detail-overlay-context";
import { useMoments } from "@/contexts/moments-context";
import { useThreads } from "@/contexts/threads-context";
import type { Moment } from "@/data/mockMoments";
import { useThemeColor } from "@/hooks/use-theme-color";

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
    Math.cos(fromLat) *
      Math.cos(toLat) *
      Math.sin(lngDelta / 2) *
      Math.sin(lngDelta / 2);

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
  const { session } = useAuth();
  const { moments, loading, loadError, refreshMoments } = useMoments();
  const {
    threads,
    loading: threadsLoading,
    loadError: threadsLoadError,
    refreshThreads,
  } = useThreads();
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const muted = useThemeColor({}, "icon");
  const userEmail = session?.user?.email ?? "";
  const userMeta = session?.user?.user_metadata as
    | { username?: string; display_name?: string }
    | undefined;
  const username =
    userMeta?.username?.trim() ||
    userMeta?.display_name?.trim() ||
    (userEmail ? userEmail.split("@")[0] : "");

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
    <SafeAreaView style={[styles.safe, { backgroundColor }]} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>
            Welkom terug{username ? `, ${username}` : ""}!
          </Text>
          <Text style={styles.welcomeSub}>
            Ontdek momenten in de buurt en de nieuwste rode draden.
          </Text>
        </View>

        <HomeMapPreview />

        {threadsLoadError ? (
          <View style={styles.bannerWrap}>
            <ErrorBanner message={threadsLoadError} onRetry={refreshThreads} />
          </View>
        ) : null}

        <View style={styles.segment}>
          <Text style={[styles.segmentTitle, { color: textColor }]}>
            Rode Draden
          </Text>
          {threadsLoading ? (
            <View style={styles.segmentState}>
              <Text style={[styles.stateText, { color: muted }]}>
                Rode draden laden...
              </Text>
            </View>
          ) : threads.length === 0 ? (
            <EmptyState
              compact
              icon="forum"
              title="Nog geen rode draden"
              message="Maak een rode draad op de kaart om de eerste rode draad te starten."
            />
          ) : (
            <Reveal style={styles.threadGrid}>
              <View style={styles.threadColumn}>
                {threads
                  .filter((_, index) => index % 2 === 0)
                  .map((thread, index) => (
                    <ThreadCard
                      key={thread.id}
                      thread={thread}
                      style={index === 0 ? undefined : styles.threadCardStacked}
                    />
                  ))}
              </View>
              <View style={styles.threadColumn}>
                {threads
                  .filter((_, index) => index % 2 === 1)
                  .map((thread, index) => (
                    <ThreadCard
                      key={thread.id}
                      thread={thread}
                      style={index === 0 ? undefined : styles.threadCardStacked}
                    />
                  ))}
              </View>
            </Reveal>
          )}
        </View>

        {loadError ? (
          <View style={styles.bannerWrap}>
            <ErrorBanner message={loadError} onRetry={refreshMoments} />
          </View>
        ) : null}

        <View style={styles.segment}>
          <Text style={[styles.segmentTitle, { color: textColor }]}>
            Momenten
          </Text>
          {loading ? (
            <View style={styles.segmentState}>
              <Text style={[styles.stateText, { color: muted }]}>
                Momenten laden...
              </Text>
            </View>
          ) : count === 0 ? (
            <EmptyState
              icon="photo-camera"
              title="Nog geen momenten"
              message="Upload je eerste moment om je proximity feed op te bouwen."
            />
          ) : (
            <Reveal style={styles.listWrap}>
              {displayFeed.map((moment, index) => {
                const position =
                  count === 1
                    ? "single"
                    : index === 0
                      ? "first"
                      : index === count - 1
                        ? "last"
                        : "middle";
                return (
                  <MomentCard
                    key={moment.id}
                    moment={moment}
                    position={position}
                    onPress={() => presentMomentById(moment.id)}
                  />
                );
              })}
            </Reveal>
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
    paddingTop: 12,
    paddingBottom: 24,
  },
  welcomeCard: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 16,
    padding: 20,
    borderRadius: 20,
    backgroundColor: Brand.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
  welcomeTitle: {
    fontFamily: FontFamily.titleBold,
    fontSize: 22,
    marginBottom: 6,
    color: "#FFFFFF",
  },
  welcomeSub: {
    fontFamily: FontFamily.body,
    fontSize: 15,
    lineHeight: 21,
    color: "rgba(255,255,255,0.9)",
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
  threadGrid: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 8,
  },
  threadColumn: {
    flex: 1,
  },
  threadCardStacked: {
    marginTop: -34,
  },
  stateText: {
    fontFamily: FontFamily.body,
    fontSize: 15,
    lineHeight: 21,
  },
  bannerWrap: {
    marginHorizontal: 16,
    marginTop: 12,
  },
});

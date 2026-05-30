import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import type { ComponentRef } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MapView from "react-native-maps/lib/MapView";

import { MapPinMarker } from "@/components/map-pin";
import { Brand } from "@/constants/theme";
import { FontFamily } from "@/constants/typography";
import { useMomentDetailOverlay } from "@/contexts/moment-detail-overlay-context";
import { useMoments } from "@/contexts/moments-context";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
  getInitialRegionForCoordinates,
  getMomentCoordinates,
} from "@/utils/moments-map-region";

const PREVIEW_HEIGHT = 220;

export default function HomeMapPreview() {
  const router = useRouter();
  const { presentMomentById } = useMomentDetailOverlay();
  const mapRef = useRef<ComponentRef<typeof MapView> | null>(null);
  const { moments } = useMoments();
  const chipBg = useThemeColor(
    { light: "rgba(255,255,255,0.94)", dark: "rgba(42,37,32,0.94)" },
    "background",
  );
  const chipText = useThemeColor({}, "text");
  const badgeText = useThemeColor(
    { light: "#FFFFFF", dark: "#FFFFFF" },
    "text",
  );
  const coordinates = useMemo(() => getMomentCoordinates(moments), [moments]);
  const initialRegion = useMemo(
    () => getInitialRegionForCoordinates(coordinates),
    [coordinates],
  );

  const fitMap = useCallback(() => {
    if (coordinates.length === 0) return;
    mapRef.current?.fitToCoordinates(coordinates, {
      edgePadding: { top: 40, right: 14, bottom: 56, left: 14 },
      animated: false,
    });
  }, [coordinates]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      fitMap();
    });
    return () => cancelAnimationFrame(id);
  }, [fitMap]);

  const countLabel =
    moments.length === 0
      ? "Nog geen momenten"
      : moments.length === 1
        ? "1 moment"
        : `${moments.length} momenten`;

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
          toolbarEnabled={false}
          showsScale
        >
          {moments.map((moment) => (
            <MapPinMarker
              key={moment.id}
              coordinate={{
                latitude: moment.location.latitude,
                longitude: moment.location.longitude,
              }}
              color={Brand.primary}
              size={32}
              title={moment.title}
              description={`${moment.username} · ${moment.location.label}`}
              onPress={() => presentMomentById(moment.id)}
            />
          ))}
        </MapView>

        <View style={styles.countBadge} pointerEvents="none">
          <Text style={[styles.countBadgeText, { color: badgeText }]}>
            {countLabel}
          </Text>
        </View>

        <Pressable
          onPress={() => router.push("/map")}
          style={({ pressed }) => [
            styles.openChip,
            { backgroundColor: chipBg },
            pressed && styles.openChipPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Open volledige kaart"
        >
          <Text style={[styles.openChipText, { color: chipText }]}>
            Volledige kaart
          </Text>
          <MaterialIcons name="chevron-right" size={20} color={Brand.primary} />
        </Pressable>
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
    overflow: "hidden",
    backgroundColor: "#E8E4DC",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    height: PREVIEW_HEIGHT,
    position: "relative",
  },
  map: {
    width: "100%",
    height: PREVIEW_HEIGHT,
  },
  countBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(196, 69, 54, 0.92)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    maxWidth: "72%",
  },
  countBadgeText: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    fontWeight: "700",
  },
  openChip: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  openChipPressed: {
    opacity: 0.92,
  },
  openChipText: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    fontWeight: "700",
  },
});

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Location from "expo-location";
import type { ComponentRef } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { MapType } from "react-native-maps";
import Marker from "react-native-maps/lib/MapMarker";
import MapView from "react-native-maps/lib/MapView";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MapScreenShell } from "@/components/map-screen-shell";
import { ThreadNumberedMarker } from "@/components/thread-numbered-marker";
import { ThreadRopeMapLayer } from "@/components/thread-rope-map-layer";
import { Brand } from "@/constants/theme";
import { FontFamily } from "@/constants/typography";
import { useMomentDetailOverlay } from "@/contexts/moment-detail-overlay-context";
import { useMoments } from "@/contexts/moments-context";
import { useThreads } from "@/contexts/threads-context";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
  getInitialRegionForCoordinates,
  getMomentCoordinates,
} from "@/utils/moments-map-region";
import { insertThreadFromMapInSupabase } from "@/utils/threads-supabase";

export default function MapScreenNative() {
  const { presentMomentById } = useMomentDetailOverlay();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<ComponentRef<typeof MapView> | null>(null);
  const { moments } = useMoments();
  const { refreshThreads } = useThreads();
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  const [composeThread, setComposeThread] = useState(false);
  const [selectedMomentIds, setSelectedMomentIds] = useState<string[]>([]);
  const [threadTitle, setThreadTitle] = useState("");
  const [savingThread, setSavingThread] = useState(false);
  const [mapViewType, setMapViewType] = useState<MapType>("standard");
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const coordinates = useMemo(() => getMomentCoordinates(moments), [moments]);
  const mapCoordinates = useMemo(() => {
    if (!userLocation) return coordinates;
    return [...coordinates, userLocation];
  }, [coordinates, userLocation]);
  const initialRegion = useMemo(
    () => getInitialRegionForCoordinates(mapCoordinates),
    [mapCoordinates],
  );
  const buttonColor = useThemeColor(
    { light: Brand.primary, dark: Brand.secondary },
    "tint",
  );
  const buttonTextColor = "#FFFFFF";
  const muted = useThemeColor({}, "icon");
  const surfaceText = useThemeColor({}, "text");
  const panelBg = useThemeColor(
    { light: "rgba(255,255,255,0.98)", dark: "#2A2520" },
    "background",
  );
  const inputBg = useThemeColor(
    { light: "rgba(107, 124, 110, 0.08)", dark: "rgba(255,253,226,0.06)" },
    "background",
  );

  const threadWaypoints = useMemo(() => {
    return selectedMomentIds
      .map((id) => moments.find((m) => m.id === id))
      .filter(Boolean)
      .map((m) => ({
        latitude: m!.location.latitude,
        longitude: m!.location.longitude,
      }));
  }, [selectedMomentIds, moments]);

  const exitCompose = useCallback(() => {
    setComposeThread(false);
    setSelectedMomentIds([]);
    setThreadTitle("");
  }, []);

  const onToggleMomentInThread = useCallback((momentId: string) => {
    setSelectedMomentIds((prev) =>
      prev.includes(momentId)
        ? prev.filter((id) => id !== momentId)
        : [...prev, momentId],
    );
  }, []);

  const onSaveThread = useCallback(async () => {
    if (selectedMomentIds.length < 2) {
      Alert.alert(
        "Meer momenten nodig",
        "Kies minstens twee momenten in de gewenste volgorde.",
      );
      return;
    }

    const orderedMoments = selectedMomentIds
      .map((id) => moments.find((m) => m.id === id))
      .filter(Boolean);
    if (orderedMoments.length < 2) {
      Alert.alert(
        "Ongeldige selectie",
        "Deze momenten zijn niet meer beschikbaar.",
      );
      return;
    }

    const contentSummary = orderedMoments.map((m) => m!.title).join(" → ");

    setSavingThread(true);
    try {
      const { error } = await insertThreadFromMapInSupabase({
        title: threadTitle,
        orderedMomentIds: selectedMomentIds,
        contentSummary,
      });
      if (error) {
        Alert.alert("Opslaan mislukt", error);
        return;
      }
      await refreshThreads();
      Alert.alert(
        "Opgeslagen",
        "Je rode draad staat bij Discussies op de homepagina.",
      );
      exitCompose();
    } finally {
      setSavingThread(false);
    }
  }, [selectedMomentIds, moments, threadTitle, refreshThreads, exitCompose]);

  const startCompose = useCallback(() => {
    if (moments.length < 2) {
      Alert.alert(
        "Niet genoeg momenten",
        "Er moeten minstens twee momenten op de kaart staan om een rode draad te maken.",
      );
      return;
    }
    setComposeThread(true);
    setSelectedMomentIds([]);
    setThreadTitle("");
  }, [moments.length]);

  const fitMap = useCallback(() => {
    if (mapCoordinates.length === 0) return;
    mapRef.current?.fitToCoordinates(mapCoordinates, {
      edgePadding: { top: 72, right: 28, bottom: 112, left: 28 },
      animated: true,
    });
  }, [mapCoordinates]);

  const toggleMapViewType = useCallback(() => {
    setMapViewType((prev) => (prev === "hybrid" ? "standard" : "hybrid"));
  }, []);

  const fetchUserLocation = useCallback(async () => {
    try {
      setIsLocating(true);
      setLocationError("");
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationError(
          "Geef locatie-toegang om je positie op de kaart te tonen.",
        );
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
        450,
      );
    } catch {
      setLocationError("Kon je locatie niet ophalen. Probeer opnieuw.");
    } finally {
      setIsLocating(false);
    }
  }, []);

  useEffect(() => {
    void fetchUserLocation();
  }, [fetchUserLocation]);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  const composerBottom = insets.bottom + keyboardHeight + 12;

  return (
    <MapScreenShell>
      <View style={styles.root}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          onMapReady={fitMap}
          mapType={mapViewType}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
          showsScale
        >
          {moments.map((moment) => {
            const selectedIndex = selectedMomentIds.indexOf(moment.id);
            const selected = selectedIndex >= 0;
            const coordinate = {
              latitude: moment.location.latitude,
              longitude: moment.location.longitude,
            };

            if (composeThread && selected) {
              return (
                <ThreadNumberedMarker
                  key={`thread-pin-${moment.id}-${selectedIndex + 1}`}
                  coordinate={coordinate}
                  order={selectedIndex + 1}
                  title={moment.title}
                  description="Tik om uit de route te halen"
                  onPress={() => onToggleMomentInThread(moment.id)}
                />
              );
            }

            return (
              <Marker
                key={moment.id}
                coordinate={coordinate}
                title={moment.title}
                description={
                  composeThread
                    ? "Tik om toe te voegen aan de rode draad"
                    : `${moment.username} · ${moment.location.label}`
                }
                pinColor={composeThread ? Brand.primary : undefined}
                tracksViewChanges={false}
                onPress={
                  composeThread
                    ? () => onToggleMomentInThread(moment.id)
                    : () => presentMomentById(moment.id)
                }
              />
            );
          })}
          {userLocation ? (
            <Marker
              coordinate={userLocation}
              title="Jouw locatie"
              description="Huidige positie"
              pinColor="#1F7AE0"
              tracksViewChanges={false}
            />
          ) : null}
          {composeThread ? (
            <ThreadRopeMapLayer waypoints={threadWaypoints} />
          ) : null}
        </MapView>

        {composeThread ? (
          <View
            style={[
              styles.threadComposer,
              {
                backgroundColor: panelBg,
                bottom: composerBottom,
              },
            ]}
          >
            <Text style={[styles.composerThreadHelp, { color: muted }]}>
              Rode draad: tik op pins in volgorde. Genummerde markers tonen je
              route. Tik opnieuw om een moment te verwijderen.
            </Text>
            <Text style={[styles.composerHint, { color: muted }]}>
              Minimaal 2 momenten. Volgorde:{" "}
              <Text style={{ fontWeight: "700", color: surfaceText }}>
                {selectedMomentIds.length}
              </Text>
            </Text>
            <TextInput
              value={threadTitle}
              onChangeText={setThreadTitle}
              placeholder="Titel (optioneel)"
              placeholderTextColor={muted}
              style={[
                styles.titleInput,
                { color: surfaceText, backgroundColor: inputBg },
              ]}
              editable={!savingThread}
              returnKeyType="done"
              blurOnSubmit
            />
            <View style={styles.composerActions}>
              <Pressable
                onPress={exitCompose}
                disabled={savingThread}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  { borderColor: Brand.neutral },
                  pressed && styles.pressedBtn,
                  savingThread && styles.disabledBtn,
                ]}
              >
                <Text style={[styles.secondaryBtnText, { color: surfaceText }]}>
                  Annuleren
                </Text>
              </Pressable>
              <Pressable
                onPress={() => void onSaveThread()}
                disabled={savingThread || selectedMomentIds.length < 2}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: buttonColor },
                  pressed && styles.pressedBtn,
                  (savingThread || selectedMomentIds.length < 2) &&
                    styles.disabledBtn,
                ]}
              >
                {savingThread ? (
                  <ActivityIndicator color={buttonTextColor} />
                ) : (
                  <Text
                    style={[styles.primaryBtnText, { color: buttonTextColor }]}
                  >
                    Opslaan
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.controls}>
          <View style={styles.toolRow}>
            <Pressable
              onPress={fitMap}
              disabled={mapCoordinates.length === 0}
              accessibilityRole="button"
              accessibilityLabel="Toon alle pins op de kaart"
              style={({ pressed }) => [
                styles.roundTool,
                { backgroundColor: buttonColor },
                pressed && styles.pressedBtn,
                mapCoordinates.length === 0 && styles.disabledBtn,
              ]}
            >
              <MaterialIcons
                name="zoom-out-map"
                size={22}
                color={buttonTextColor}
              />
            </Pressable>
            <Pressable
              onPress={toggleMapViewType}
              accessibilityRole="button"
              accessibilityLabel={
                mapViewType === "hybrid"
                  ? "Schakel naar normale kaart"
                  : "Schakel naar hybride kaart met satellietbeeld"
              }
              style={({ pressed }) => [
                styles.roundTool,
                { backgroundColor: buttonColor },
                pressed && styles.pressedBtn,
              ]}
            >
              <MaterialIcons
                name={mapViewType === "hybrid" ? "map" : "layers"}
                size={22}
                color={buttonTextColor}
              />
            </Pressable>
          </View>

          <Pressable
            onPress={composeThread ? exitCompose : startCompose}
            style={({ pressed }) => [
              styles.threadModeButton,
              {
                backgroundColor: composeThread ? Brand.neutral : buttonColor,
              },
              pressed && styles.pressedBtn,
              moments.length < 2 && !composeThread && styles.disabledBtn,
            ]}
            disabled={!composeThread && moments.length < 2}
          >
            <MaterialIcons
              name={composeThread ? "close" : "timeline"}
              size={18}
              color={buttonTextColor}
            />
            <Text
              style={[styles.locationButtonText, { color: buttonTextColor }]}
            >
              {composeThread ? "Stop rode draad" : "Rode draad"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => void fetchUserLocation()}
            style={[
              styles.locationButton,
              { backgroundColor: buttonColor },
              isLocating && styles.locationButtonDisabled,
            ]}
            disabled={isLocating}
          >
            <MaterialIcons
              name="my-location"
              size={16}
              color={buttonTextColor}
            />
            <Text
              style={[styles.locationButtonText, { color: buttonTextColor }]}
            >
              {isLocating ? "Locatie laden..." : "Mijn locatie"}
            </Text>
          </Pressable>
          {locationError ? (
            <Text style={[styles.errorText, { color: muted }]}>
              {locationError}
            </Text>
          ) : null}
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
    position: "absolute",
    right: 14,
    bottom: 14,
    width: 188,
    gap: 10,
  },
  toolRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  roundTool: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 3,
  },
  threadModeButton: {
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 3,
  },
  locationButton: {
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: "#000",
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
    fontWeight: "700",
  },
  errorText: {
    marginTop: 6,
    fontFamily: FontFamily.body,
    fontSize: 12,
    lineHeight: 15,
    textAlign: "right",
  },
  threadComposer: {
    position: "absolute",
    left: 14,
    right: 14,
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(107, 124, 110, 0.35)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
  },
  composerThreadHelp: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  composerHint: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    marginBottom: 8,
  },
  titleInput: {
    fontFamily: FontFamily.body,
    fontSize: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  composerActions: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryBtnText: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    fontWeight: "600",
  },
  primaryBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  primaryBtnText: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    fontWeight: "700",
  },
  pressedBtn: {
    opacity: 0.88,
  },
  disabledBtn: {
    opacity: 0.55,
  },
});

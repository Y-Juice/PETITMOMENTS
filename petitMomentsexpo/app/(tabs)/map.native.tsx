import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Location from "expo-location";
import { useLocalSearchParams } from "expo-router";
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
import MapView from "react-native-maps/lib/MapView";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MapPinMarker } from "@/components/map-pin";
import { MapScreenShell } from "@/components/map-screen-shell";
import { ThreadNumberedMarker } from "@/components/thread-numbered-marker";
import { ThreadRopeMapLayer } from "@/components/thread-rope-map-layer";
import { Brand } from "@/constants/theme";
import { FontFamily } from "@/constants/typography";
import { useMomentDetailOverlay } from "@/contexts/moment-detail-overlay-context";
import { useMoments } from "@/contexts/moments-context";
import { useThreads } from "@/contexts/threads-context";
import { useThemeColor } from "@/hooks/use-theme-color";
import { feedbackSelectionTap } from "@/utils/feedback";
import {
  bearingDegrees,
  compassLabel,
  distanceMeters,
  distanceToNearestPoint,
  formatDistance,
  formatDuration,
} from "@/utils/geo";
import {
  getInitialRegionForCoordinates,
  getMomentCoordinates,
} from "@/utils/moments-map-region";
import Polyline from "react-native-maps/lib/MapPolyline";
import {
  fetchRoute,
  hasRoutingKey,
  type PlannedRoute,
  type RouteProfile,
} from "@/utils/routing";
import { insertThreadFromMapInSupabase } from "@/utils/threads-supabase";

export default function MapScreenNative() {
  const { presentMomentById } = useMomentDetailOverlay();
  const params = useLocalSearchParams<{
    threadId?: string;
    followThreadId?: string;
    followMomentId?: string;
    ts?: string;
  }>();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<ComponentRef<typeof MapView> | null>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const firstFollowFixRef = useRef(true);
  const { moments } = useMoments();
  const { threads, refreshThreads } = useThreads();
  const [viewThreadId, setViewThreadId] = useState<string | null>(null);
  const [follow, setFollow] = useState<
    { kind: "moment"; momentId: string } | { kind: "thread"; threadId: string } | null
  >(null);
  const [followStopIndex, setFollowStopIndex] = useState(0);
  const [followArrived, setFollowArrived] = useState(false);
  const [routeProfile, setRouteProfile] = useState<RouteProfile>("foot-walking");
  const [plannedRoute, setPlannedRoute] = useState<PlannedRoute | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const routeKeyRef = useRef("");
  const lastRouteFetchRef = useRef(0);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  const [composeThread, setComposeThread] = useState(false);
  const [selectedMomentIds, setSelectedMomentIds] = useState<string[]>([]);
  const [threadTitle, setThreadTitle] = useState("");
  const [threadDescription, setThreadDescription] = useState("");
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

  const viewThread = useMemo(
    () => threads.find((t) => t.id === viewThreadId),
    [threads, viewThreadId],
  );

  const viewRouteStops = useMemo(() => {
    if (!viewThread?.momentIds) return [];
    return viewThread.momentIds
      .map((id) => moments.find((m) => m.id === id))
      .filter(Boolean)
      .map((m, index) => ({
        id: m!.id,
        title: m!.title,
        order: index + 1,
        latitude: m!.location.latitude,
        longitude: m!.location.longitude,
      }));
  }, [viewThread, moments]);

  const viewWaypoints = useMemo(
    () =>
      viewRouteStops.map((stop) => ({
        latitude: stop.latitude,
        longitude: stop.longitude,
      })),
    [viewRouteStops],
  );

  const clearViewThread = useCallback(() => {
    setViewThreadId(null);
  }, []);

  const followTarget = useMemo<
    { latitude: number; longitude: number; title: string } | null
  >(() => {
    if (!follow) return null;
    if (follow.kind === "moment") {
      const m = moments.find((x) => x.id === follow.momentId);
      return m
        ? {
            latitude: m.location.latitude,
            longitude: m.location.longitude,
            title: m.title,
          }
        : null;
    }
    const stop = viewRouteStops[followStopIndex];
    return stop
      ? { latitude: stop.latitude, longitude: stop.longitude, title: stop.title }
      : null;
  }, [follow, moments, viewRouteStops, followStopIndex]);

  const guidance = useMemo(() => {
    if (!followTarget || !userLocation) return null;
    return {
      distance: distanceMeters(userLocation, followTarget),
      bearing: bearingDegrees(userLocation, followTarget),
    };
  }, [followTarget, userLocation]);

  const stopFollow = useCallback(() => {
    setFollow(null);
    setFollowStopIndex(0);
    setFollowArrived(false);
    setViewThreadId(null);
    setPlannedRoute(null);
    setRouteError(null);
    routeKeyRef.current = "";
  }, []);

  const advanceFollowStop = useCallback(() => {
    setFollowStopIndex((prev) =>
      Math.min(prev + 1, Math.max(0, viewRouteStops.length - 1)),
    );
    setFollowArrived(false);
  }, [viewRouteStops.length]);

  const exitCompose = useCallback(() => {
    setComposeThread(false);
    setSelectedMomentIds([]);
    setThreadTitle("");
    setThreadDescription("");
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
        description: threadDescription,
      });
      if (error) {
        Alert.alert("Opslaan mislukt", error);
        return;
      }
      await refreshThreads();
      Alert.alert(
        "Opgeslagen",
        "Je rode draad staat bij Rode Draden op de homepagina.",
      );
      exitCompose();
    } finally {
      setSavingThread(false);
    }
  }, [
    selectedMomentIds,
    moments,
    threadTitle,
    threadDescription,
    refreshThreads,
    exitCompose,
  ]);

  const startCompose = useCallback(() => {
    if (moments.length < 2) {
      Alert.alert(
        "Niet genoeg momenten",
        "Er moeten minstens twee momenten op de kaart staan om een rode draad te maken.",
      );
      return;
    }
    setViewThreadId(null);
    setFollow(null);
    setComposeThread(true);
    setSelectedMomentIds([]);
    setThreadTitle("");
    setThreadDescription("");
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
    if (params.threadId) {
      setComposeThread(false);
      setFollow(null);
      setViewThreadId(String(params.threadId));
    }
  }, [params.threadId, params.ts]);

  useEffect(() => {
    if (params.followMomentId) {
      setComposeThread(false);
      setViewThreadId(null);
      setFollowStopIndex(0);
      setFollowArrived(false);
      setPlannedRoute(null);
      setRouteError(null);
      routeKeyRef.current = "";
      firstFollowFixRef.current = true;
      setFollow({ kind: "moment", momentId: String(params.followMomentId) });
    }
  }, [params.followMomentId, params.ts]);

  useEffect(() => {
    if (params.followThreadId) {
      const id = String(params.followThreadId);
      setComposeThread(false);
      setViewThreadId(id);
      setFollowStopIndex(0);
      setFollowArrived(false);
      setPlannedRoute(null);
      setRouteError(null);
      routeKeyRef.current = "";
      firstFollowFixRef.current = true;
      setFollow({ kind: "thread", threadId: id });
    }
  }, [params.followThreadId, params.ts]);

  useEffect(() => {
    if (!viewThreadId || follow || viewWaypoints.length < 1) return;
    const id = requestAnimationFrame(() => {
      mapRef.current?.fitToCoordinates(viewWaypoints, {
        edgePadding: { top: 130, right: 40, bottom: 160, left: 40 },
        animated: true,
      });
    });
    return () => cancelAnimationFrame(id);
  }, [viewThreadId, viewWaypoints, follow]);

  useEffect(() => {
    if (!follow) {
      watchRef.current?.remove();
      watchRef.current = null;
      return;
    }

    let cancelled = false;

    void (async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationError("Geef locatie-toegang om de route te volgen.");
        return;
      }
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 4,
          timeInterval: 1500,
        },
        (location) => {
          if (cancelled) return;
          const next = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setUserLocation(next);
          if (firstFollowFixRef.current) {
            firstFollowFixRef.current = false;
            mapRef.current?.animateToRegion(
              { ...next, latitudeDelta: 0.01, longitudeDelta: 0.01 },
              450,
            );
          }
        },
      );
      if (cancelled) {
        subscription.remove();
        return;
      }
      watchRef.current = subscription;
    })();

    return () => {
      cancelled = true;
      watchRef.current?.remove();
      watchRef.current = null;
    };
  }, [follow]);

  useEffect(() => {
    if (!follow || !guidance) return;
    const ARRIVAL_METERS = 25;
    if (guidance.distance > ARRIVAL_METERS) {
      if (followArrived) setFollowArrived(false);
      return;
    }
    if (follow.kind === "thread" && followStopIndex < viewRouteStops.length - 1) {
      setFollowStopIndex((prev) => prev + 1);
      feedbackSelectionTap();
      return;
    }
    if (!followArrived) {
      setFollowArrived(true);
      feedbackSelectionTap();
    }
  }, [follow, guidance, followArrived, followStopIndex, viewRouteStops.length]);

  useEffect(() => {
    if (!follow || !followTarget || !userLocation || !hasRoutingKey()) return;

    const target = followTarget;
    const key = `${routeProfile}|${target.latitude.toFixed(5)},${target.longitude.toFixed(5)}`;
    const targetChanged = key !== routeKeyRef.current;
    const offRoute = plannedRoute
      ? distanceToNearestPoint(userLocation, plannedRoute.coordinates) > 45
      : true;
    const now = Date.now();

    if (!targetChanged && !offRoute) return;
    if (!targetChanged && now - lastRouteFetchRef.current < 6000) return;

    routeKeyRef.current = key;
    lastRouteFetchRef.current = now;

    let active = true;
    setRouteLoading(true);
    setRouteError(null);
    fetchRoute(userLocation, target, routeProfile)
      .then((route) => {
        if (!active) return;
        setPlannedRoute(route);
        if (!route) {
          setRouteError("Geen route gevonden voor dit profiel.");
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        setPlannedRoute(null);
        setRouteError(
          err instanceof Error ? err.message : "Route berekenen mislukt.",
        );
      })
      .finally(() => {
        if (active) setRouteLoading(false);
      });

    return () => {
      active = false;
    };
  }, [follow, followTarget, userLocation, routeProfile, plannedRoute]);

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
              <MapPinMarker
                key={moment.id}
                coordinate={coordinate}
                color={Brand.primary}
                title={moment.title}
                description={
                  composeThread
                    ? "Tik om toe te voegen aan de rode draad"
                    : `${moment.username} · ${moment.location.label}`
                }
                onPress={
                  composeThread
                    ? () => onToggleMomentInThread(moment.id)
                    : () => presentMomentById(moment.id)
                }
              />
            );
          })}
          {userLocation ? (
            <MapPinMarker
              coordinate={userLocation}
              color="#1F7AE0"
              title="Jouw locatie"
              description="Huidige positie"
            />
          ) : null}
          {composeThread ? (
            <ThreadRopeMapLayer waypoints={threadWaypoints} />
          ) : null}
          {!composeThread && viewThreadId ? (
            <ThreadRopeMapLayer
              waypoints={viewWaypoints}
              stops={viewRouteStops}
              onStopPress={(id) => presentMomentById(id)}
            />
          ) : null}
          {follow && userLocation && followTarget ? (
            plannedRoute ? (
              <Polyline
                coordinates={plannedRoute.coordinates}
                strokeColor="#1F7AE0"
                strokeWidth={5}
                lineCap="round"
                lineJoin="round"
              />
            ) : (
              <Polyline
                coordinates={[userLocation, followTarget]}
                strokeColor="#1F7AE0"
                strokeWidth={3}
                lineDashPattern={[8, 8]}
                lineCap="round"
              />
            )
          ) : null}
        </MapView>

        {!composeThread && viewThread && !follow ? (
          <View
            style={[
              styles.viewBanner,
              { backgroundColor: panelBg, top: insets.top + 12 },
            ]}
          >
            <MaterialIcons name="timeline" size={20} color={Brand.primary} />
            <View style={styles.viewBannerText}>
              <Text
                style={[styles.viewBannerTitle, { color: surfaceText }]}
                numberOfLines={1}
              >
                {viewThread.title}
              </Text>
              <Text style={[styles.viewBannerMeta, { color: muted }]}>
                Rode draad · {viewRouteStops.length} momenten
              </Text>
            </View>
            <Pressable
              onPress={clearViewThread}
              style={({ pressed }) => [
                styles.viewBannerClose,
                pressed && styles.pressedBtn,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Sluit deze rode draad"
            >
              <MaterialIcons name="close" size={20} color={surfaceText} />
            </Pressable>
          </View>
        ) : null}

        {follow && followTarget ? (
          <View
            style={[
              styles.followPanel,
              { backgroundColor: panelBg, top: insets.top + 12 },
            ]}
          >
            <View style={styles.followHeader}>
              <View style={styles.followArrowWrap}>
                <MaterialIcons
                  name="navigation"
                  size={26}
                  color="#1F7AE0"
                  style={
                    guidance
                      ? { transform: [{ rotate: `${guidance.bearing}deg` }] }
                      : undefined
                  }
                />
              </View>
              <View style={styles.followText}>
                <Text
                  style={[styles.followTitle, { color: surfaceText }]}
                  numberOfLines={1}
                >
                  {follow.kind === "thread"
                    ? `Stap ${followStopIndex + 1} van ${viewRouteStops.length}: ${followTarget.title}`
                    : followTarget.title}
                </Text>
                <Text style={[styles.followMeta, { color: muted }]}>
                  {!guidance
                    ? "Locatie laden..."
                    : followArrived
                      ? follow.kind === "thread"
                        ? "Eindpunt bereikt"
                        : "Je bent er!"
                      : routeLoading && !plannedRoute
                        ? "Route berekenen..."
                        : plannedRoute
                          ? `${formatDistance(plannedRoute.distanceMeters)} · ${formatDuration(plannedRoute.durationSeconds)}`
                          : `${formatDistance(guidance.distance)} · richting ${compassLabel(guidance.bearing)}`}
                </Text>
              </View>
              <Pressable
                onPress={stopFollow}
                style={({ pressed }) => [
                  styles.viewBannerClose,
                  pressed && styles.pressedBtn,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Stop met volgen"
              >
                <MaterialIcons name="close" size={20} color={surfaceText} />
              </Pressable>
            </View>

            {hasRoutingKey() ? (
              <View style={styles.profileRow}>
                <Pressable
                  onPress={() => setRouteProfile("foot-walking")}
                  style={[
                    styles.profileBtn,
                    routeProfile === "foot-walking" && {
                      backgroundColor: buttonColor,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Route te voet"
                >
                  <MaterialIcons
                    name="directions-walk"
                    size={18}
                    color={
                      routeProfile === "foot-walking" ? "#FFFFFF" : surfaceText
                    }
                  />
                  <Text
                    style={[
                      styles.profileBtnText,
                      {
                        color:
                          routeProfile === "foot-walking"
                            ? "#FFFFFF"
                            : surfaceText,
                      },
                    ]}
                  >
                    Te voet
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setRouteProfile("cycling-regular")}
                  style={[
                    styles.profileBtn,
                    routeProfile === "cycling-regular" && {
                      backgroundColor: buttonColor,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Route met de fiets"
                >
                  <MaterialIcons
                    name="directions-bike"
                    size={18}
                    color={
                      routeProfile === "cycling-regular"
                        ? "#FFFFFF"
                        : surfaceText
                    }
                  />
                  <Text
                    style={[
                      styles.profileBtnText,
                      {
                        color:
                          routeProfile === "cycling-regular"
                            ? "#FFFFFF"
                            : surfaceText,
                      },
                    ]}
                  >
                    Fiets
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Text style={[styles.followHint, { color: muted }]}>
                Stel een routesleutel in voor straatroutes (nu rechte lijn).
              </Text>
            )}

            {routeError ? (
              <Text style={[styles.followHint, { color: Brand.primary }]}>
                {routeError}
              </Text>
            ) : null}

            {follow.kind === "thread" &&
            followStopIndex < viewRouteStops.length - 1 ? (
              <Pressable
                onPress={advanceFollowStop}
                style={({ pressed }) => [
                  styles.followStepBtn,
                  { borderColor: Brand.primary },
                  pressed && styles.pressedBtn,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Ga naar de volgende stap"
              >
                <MaterialIcons
                  name="skip-next"
                  size={18}
                  color={Brand.primary}
                />
                <Text style={[styles.followStepText, { color: Brand.primary }]}>
                  Volgende stap
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

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
            <TextInput
              value={threadDescription}
              onChangeText={setThreadDescription}
              placeholder="Korte omschrijving (optioneel)"
              placeholderTextColor={muted}
              style={[
                styles.descriptionInput,
                { color: surfaceText, backgroundColor: inputBg },
              ]}
              editable={!savingThread}
              multiline
              maxLength={280}
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
  followPanel: {
    position: "absolute",
    left: 14,
    right: 14,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(31, 122, 224, 0.35)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
  },
  followHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  followArrowWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(31, 122, 224, 0.12)",
  },
  followText: {
    flex: 1,
  },
  followTitle: {
    fontFamily: FontFamily.titleBold,
    fontSize: 15,
  },
  followMeta: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    marginTop: 2,
  },
  profileRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  profileBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(107, 124, 110, 0.14)",
  },
  profileBtnText: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    fontWeight: "700",
  },
  followHint: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 10,
  },
  followStepBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
  },
  followStepText: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    fontWeight: "700",
  },
  viewBanner: {
    position: "absolute",
    left: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(196, 69, 54, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
  },
  viewBannerText: {
    flex: 1,
  },
  viewBannerTitle: {
    fontFamily: FontFamily.titleBold,
    fontSize: 15,
  },
  viewBannerMeta: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    marginTop: 2,
  },
  viewBannerClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
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
    marginBottom: 10,
  },
  descriptionInput: {
    fontFamily: FontFamily.body,
    fontSize: 15,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    minHeight: 64,
    textAlignVertical: "top",
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

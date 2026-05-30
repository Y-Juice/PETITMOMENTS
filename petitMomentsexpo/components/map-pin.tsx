import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Marker from "react-native-maps/lib/MapMarker";

import { Brand } from "@/constants/theme";

type Coordinate = {
  latitude: number;
  longitude: number;
};

type MapPinGlyphProps = {
  color?: string;
  size?: number;
};

/**
 * Het uiterlijk van de pin: een "place" icoon met een klein schaduwtje eronder.
 * Dit is dezelfde stijl als de pin uit de "nieuwe pin prikken" animatie, zodat
 * alle pins op de kaart er hetzelfde uitzien.
 */
export function MapPinGlyph({ color = Brand.primary, size = 42 }: MapPinGlyphProps) {
  return (
    <View style={[styles.wrap, { width: size + 2, height: size + 10 }]} collapsable={false}>
      <MaterialIcons name="place" size={size} color={color} />
      <View style={styles.shadow} />
    </View>
  );
}

type MapPinMarkerProps = {
  coordinate: Coordinate;
  color?: string;
  size?: number;
  title?: string;
  description?: string;
  onPress?: () => void;
};

/**
 * Een gewone (statische) marker die de gedeelde pin-stijl gebruikt.
 * tracksViewChanges staat eerst even aan zodat de custom view goed rendert op
 * Android, en gaat daarna uit voor de prestaties.
 */
export function MapPinMarker({
  coordinate,
  color,
  size,
  title,
  description,
  onPress,
}: MapPinMarkerProps) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), 600);
    return () => clearTimeout(timer);
  }, [color, size]);

  return (
    <Marker
      coordinate={coordinate}
      title={title}
      description={description}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={tracksViewChanges}
      onPress={onPress}>
      <MapPinGlyph color={color} size={size} />
    </Marker>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
  },
  shadow: {
    width: 10,
    height: 4,
    borderRadius: 5,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    marginTop: -4,
  },
});

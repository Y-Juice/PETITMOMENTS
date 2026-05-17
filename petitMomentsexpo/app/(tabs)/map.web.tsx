import { StyleSheet, View } from "react-native";

import { MapPlaceholder } from "@/components/map-placeholder";
import { MapScreenShell } from "@/components/map-screen-shell";

export default function MapScreenWeb() {
  return (
    <MapScreenShell>
      <View style={styles.center}>
        <MapPlaceholder />
      </View>
    </MapScreenShell>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 32,
    paddingHorizontal: 8,
  },
});

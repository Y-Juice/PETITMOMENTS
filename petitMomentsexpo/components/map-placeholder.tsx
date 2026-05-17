import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, View } from "react-native";

import { Brand } from "@/constants/theme";
import { FontFamily } from "@/constants/typography";

export function MapPlaceholder() {
  return (
    <View style={styles.wrap}>
      <View style={styles.inner}>
        <View style={styles.fakeMap}>
          <View style={styles.gridLine} />
          <View style={[styles.gridLine, styles.gridLineH]} />
          <View style={styles.pin}>
            <MaterialIcons name="place" size={36} color={Brand.secondary} />
          </View>
          <Text style={styles.hint}>Map komt hier</Text>
        </View>
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
  },
  fakeMap: {
    height: 220,
    backgroundColor: "#F2EFE8",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  gridLine: {
    position: "absolute",
    left: "30%",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  gridLineH: {
    left: 0,
    right: 0,
    top: "45%",
    bottom: undefined,
    height: 1,
    width: "100%",
  },
  pin: {
    marginBottom: 8,
  },
  hint: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    color: Brand.primary,
    fontWeight: "600",
    opacity: 0.9,
  },
});

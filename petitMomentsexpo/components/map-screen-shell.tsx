import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useThemeColor } from "@/hooks/use-theme-color";

type MapScreenShellProps = {
  children: ReactNode;
};

export function MapScreenShell({ children }: MapScreenShellProps) {
  const backgroundColor = useThemeColor({}, "background");

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }]} edges={["top"]}>
      <View style={styles.body}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: {
    flex: 1,
  },
});

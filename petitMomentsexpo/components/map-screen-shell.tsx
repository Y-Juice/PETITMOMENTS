import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FontFamily } from "@/constants/typography";
import { useThemeColor } from "@/hooks/use-theme-color";

type MapScreenShellProps = {
  children: ReactNode;
  /** Extra line under the title (e.g. thread mode or web-only hint). */
  noteBelowTitle?: string;
};

export function MapScreenShell({ children, noteBelowTitle }: MapScreenShellProps) {
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const muted = useThemeColor({}, "icon");

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }]} edges={["top"]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Kaart</Text>
        {noteBelowTitle ? (
          <Text style={[styles.note, { color: muted }]}>{noteBelowTitle}</Text>
        ) : (
          <Text style={[styles.sub, { color: muted }]}>
            Momenten nabij jou op de plattegrond — tik op een pin voor de titel.
          </Text>
        )}
      </View>
      <View style={styles.body}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    paddingTop: 4,
  },
  title: {
    fontFamily: FontFamily.titleBold,
    fontSize: 20,
    marginBottom: 4,
  },
  sub: {
    fontFamily: FontFamily.body,
    fontSize: 15,
    lineHeight: 20,
  },
  note: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  body: {
    flex: 1,
  },
});

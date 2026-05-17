import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter, type Href } from "expo-router";
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { Brand } from "@/constants/theme";
import { FontFamily } from "@/constants/typography";

/** Design approximation: deep orange-red → lighter orange */
export const AUTH_GRADIENT = ["#D34735", "#F37335"] as const;

type PetitMomentLogoBlockProps = {
  /** Use light text on gradient */
};

export function PetitMomentLogoBlock(_props: PetitMomentLogoBlockProps) {
  return (
    <LinearGradient
      colors={[...AUTH_GRADIENT]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.logoGradient}
    >
      <Text style={styles.logoLine1}>petit</Text>
      <Text style={styles.logoLine2}>moment</Text>
    </LinearGradient>
  );
}

export function AuthWelcomeLine({
  children,
  color,
}: {
  children: ReactNode;
  color: string;
}) {
  return <Text style={[styles.welcome, { color }]}>{children}</Text>;
}

export function AuthOrDivider({ label = "of" }: { label?: string }) {
  return (
    <View style={styles.orWrap}>
      <View style={styles.orLine} />
      <Text style={styles.orText}>{label}</Text>
      <View style={styles.orLine} />
    </View>
  );
}

type TermsAcceptRowProps = {
  checked: boolean;
  onToggle: () => void;
  borderColor: string;
  mutedColor: string;
  linkColor: string;
  disabled?: boolean;
};

export function TermsAcceptRow({
  checked,
  onToggle,
  borderColor,
  mutedColor,
  linkColor,
  disabled,
}: TermsAcceptRowProps) {
  const router = useRouter();
  return (
    <View style={styles.termsRow}>
      <Pressable
        onPress={onToggle}
        disabled={disabled}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        style={styles.checkboxWrap}
      >
        <View
          style={[
            styles.checkbox,
            { borderColor },
            checked && styles.checkboxChecked,
          ]}
        >
          {checked ? (
            <MaterialIcons name="check" size={16} color="#FFFFFF" />
          ) : null}
        </View>
      </Pressable>
      <Text style={[styles.termsText, { color: mutedColor }]}>
        Ik heb de{" "}
        <Text
          onPress={() => router.push("/terms" as Href)}
          style={[styles.termsLink, { color: linkColor }]}
          accessibilityRole="link"
        >
          algemene voorwaarden
        </Text>{" "}
        gelezen en accepteer ze.
      </Text>
    </View>
  );
}

type GradientPrimaryButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export function GradientPrimaryButton({
  label,
  onPress,
  loading,
  disabled,
}: GradientPrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [pressed && styles.btnPressed, disabled && styles.btnMuted]}
    >
      <LinearGradient
        colors={[...AUTH_GRADIENT]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.primaryBtn}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryBtnText}>{label}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

type GradientOutlineButtonProps = {
  label: string;
  href: Href;
  textColor: string;
  fillColor: string;
};
export function GradientOutlineButton({
  label,
  href,
  textColor,
  fillColor,
}: GradientOutlineButtonProps) {
  return (
    <Link href={href} asChild>
      <Pressable style={({ pressed }) => [pressed && styles.btnPressed]}>
        <LinearGradient
          colors={[...AUTH_GRADIENT]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.outlineOuter}
        >
          <View style={[styles.outlineInner, { backgroundColor: fillColor }]}>
            <Text style={[styles.outlineLabel, { color: textColor }]}>{label}</Text>
          </View>
        </LinearGradient>
      </Pressable>
    </Link>
  );
}

export const authFieldRadius = 16;

export function authInputStyle(
  color: string,
  borderColor: string,
): Record<string, unknown> {
  return {
    fontFamily: FontFamily.body,
    fontSize: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor,
    borderRadius: authFieldRadius,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    color,
  };
}

const styles = StyleSheet.create({
  logoGradient: {
    alignSelf: "flex-start",
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    borderTopRightRadius: 26,
    borderBottomRightRadius: 26,
    marginBottom: 22,
  },
  logoLine1: {
    fontFamily: FontFamily.titleBold,
    fontSize: 26,
    color: "#FFFFFF",
    lineHeight: 30,
  },
  logoLine2: {
    fontFamily: FontFamily.titleBold,
    fontSize: 26,
    color: "#FFFFFF",
    lineHeight: 30,
  },
  welcome: {
    fontFamily: FontFamily.body,
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 22,
  },
  orWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  orLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(107, 124, 110, 0.35)",
  },
  orText: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    marginHorizontal: 14,
    color: "#6B7C6E",
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  checkboxWrap: {
    paddingTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  checkboxChecked: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  termsText: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    textDecorationLine: "underline",
    fontWeight: "700",
  },
  primaryBtn: {
    marginTop: 10,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
  },
  primaryBtnText: {
    fontFamily: FontFamily.body,
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  outlineOuter: {
    borderRadius: 16,
    padding: 2,
  },
  outlineInner: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  outlineLabel: {
    fontFamily: FontFamily.body,
    fontSize: 16,
    fontWeight: "700",
  },
  btnPressed: { opacity: 0.92 },
  btnMuted: { opacity: 0.55 },
});

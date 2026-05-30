import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCallback, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
    AuthOrDivider,
    AuthWelcomeLine,
    GradientOutlineButton,
    GradientPrimaryButton,
    PetitMomentLogoBlock,
    TermsAcceptRow,
    authInputStyle,
} from "@/components/auth/auth-screen-shared";
import { Brand } from "@/constants/theme";
import { FontFamily } from "@/constants/typography";
import { useAuth } from "@/contexts/auth-context";
import { useThemeColor } from "@/hooks/use-theme-color";

const MIN_PASSWORD = 6;

export default function LoginScreen() {
  const { signInWithEmail } = useAuth();
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const muted = useThemeColor({}, "icon");
  const welcomeColor = useThemeColor(
    { light: "#4A4A4A", dark: "rgba(255, 253, 226, 0.82)" },
    "text",
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    const e = email.trim();
    setFormError(null);
    if (!termsAccepted) {
      setFormError(
        "Je moet de algemene voorwaarden accepteren om verder te gaan.",
      );
      return;
    }
    if (!e.includes("@")) {
      setFormError("Gebruik een geldig e-mailadres.");
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setFormError(`Wachtwoord minimaal ${MIN_PASSWORD} tekens.`);
      return;
    }

    setSubmitting(true);
    const { error } = await signInWithEmail(e, password);
    setSubmitting(false);
    if (error) setFormError(error);
  }, [email, password, signInWithEmail, termsAccepted]);

  const inputExtras = Platform.select({
    ios: {
      autoCorrect: false,
      autoCapitalize: "none" as const,
    },
    default: {},
  });

  const fieldBase = authInputStyle(textColor, muted) as Record<string, unknown>;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor }]}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <PetitMomentLogoBlock />
          <AuthWelcomeLine color={welcomeColor}>
            Welkom — log in of maak een account aan.
          </AuthWelcomeLine>

          <TextInput
            style={fieldBase}
            placeholder="E-mailadres"
            placeholderTextColor={`${muted}99`}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            {...inputExtras}
          />

          <View style={styles.passwordWrap}>
            <TextInput
              style={[
                fieldBase,
                styles.passwordInput,
                { paddingRight: 48, marginBottom: 0 },
              ]}
              placeholder="Wachtwoord"
              placeholderTextColor={`${muted}99`}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
              textContentType="password"
              {...inputExtras}
            />
            <Pressable
              onPress={() => setShowPassword((v) => !v)}
              style={styles.eyeBtn}
              accessibilityLabel={
                showPassword ? "Verberg wachtwoord" : "Toon wachtwoord"
              }
              hitSlop={10}
            >
              <MaterialIcons
                name={showPassword ? "visibility-off" : "visibility"}
                size={22}
                color={muted}
              />
            </Pressable>
          </View>

          <TermsAcceptRow
            checked={termsAccepted}
            onToggle={() => setTermsAccepted((v) => !v)}
            borderColor={muted}
            mutedColor={muted}
            linkColor={Brand.primary}
          />

          {formError ? <Text style={styles.error}>{formError}</Text> : null}

          <GradientPrimaryButton
            label={submitting ? "Bezig…" : "Inloggen"}
            onPress={() => void handleSubmit()}
            loading={submitting}
            disabled={submitting}
          />

          <AuthOrDivider />

          <View style={styles.gap}>
            <GradientOutlineButton
              label="Registreren"
              href="/register"
              textColor={Brand.primary}
              fillColor={backgroundColor}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  passwordWrap: {
    position: "relative",
    marginBottom: 14,
  },
  passwordInput: {
    marginBottom: 0,
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    top: 14,
  },
  error: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    color: Brand.primary,
    marginBottom: 12,
  },
  gap: {
    marginBottom: 12,
  },
});

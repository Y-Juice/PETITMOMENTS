import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AuthOrDivider,
  AuthWelcomeLine,
  GradientOutlineButton,
  GradientPrimaryButton,
  PetitMomentLogoBlock,
  TermsAcceptRow,
  authInputStyle,
} from '@/components/auth/auth-screen-shared';
import { Brand } from '@/constants/theme';
import { FontFamily } from '@/constants/typography';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';

const MIN_PASSWORD = 6;
const MIN_USERNAME = 2;

export default function RegisterScreen() {
  const { signUpWithEmail } = useAuth();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const muted = useThemeColor({}, 'icon');
  const welcomeColor = useThemeColor(
    { light: '#4A4A4A', dark: 'rgba(255, 253, 226, 0.82)' },
    'text',
  );

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmationHint, setConfirmationHint] = useState(false);

  const handleSubmit = useCallback(async () => {
    const e = email.trim();
    const u = username.trim();
    setFormError(null);
    setConfirmationHint(false);

    if (!termsAccepted) {
      setFormError('Je moet de algemene voorwaarden accepteren om te registreren.');
      return;
    }
    if (u.length < MIN_USERNAME) {
      setFormError(`Gebruikersnaam minimaal ${MIN_USERNAME} tekens.`);
      return;
    }
    if (!e.includes('@')) {
      setFormError('Gebruik een geldig e-mailadres.');
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setFormError(`Wachtwoord minimaal ${MIN_PASSWORD} tekens.`);
      return;
    }

    setSubmitting(true);
    const { error, needsConfirmation } = await signUpWithEmail(e, password, {
      username: u,
    });
    setSubmitting(false);

    if (error) setFormError(error);
    else if (needsConfirmation) setConfirmationHint(true);
  }, [email, password, signUpWithEmail, termsAccepted, username]);

  const inputExtras = Platform.select({
    ios: {
      autoCorrect: false,
      autoCapitalize: 'none' as const,
    },
    default: {},
  });

  const fieldBase = authInputStyle(textColor, muted) as Record<string, unknown>;
  const locked = confirmationHint;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <PetitMomentLogoBlock />
          <AuthWelcomeLine color={welcomeColor}>
            Welkom — log in of maak een account aan.
          </AuthWelcomeLine>

          <TextInput
            style={fieldBase}
            placeholder="Gebruikersnaam"
            placeholderTextColor={`${muted}99`}
            value={username}
            onChangeText={setUsername}
            autoComplete="username"
            textContentType="username"
            editable={!locked}
            {...inputExtras}
          />

          <TextInput
            style={fieldBase}
            placeholder="E-mailadres"
            placeholderTextColor={`${muted}99`}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            editable={!locked}
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
              autoComplete="password-new"
              textContentType="newPassword"
              editable={!locked}
              {...inputExtras}
            />
            <Pressable
              onPress={() => setShowPassword((v) => !v)}
              style={styles.eyeBtn}
              accessibilityLabel={showPassword ? 'Verberg wachtwoord' : 'Toon wachtwoord'}
              hitSlop={10}
              disabled={locked}>
              <MaterialIcons
                name={showPassword ? 'visibility-off' : 'visibility'}
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
            disabled={locked}
          />

          {formError ? <Text style={styles.error}>{formError}</Text> : null}
          {confirmationHint ? (
            <Text style={[styles.success, { color: muted }]}>
              Controleer je inbox en bevestig je e-mailadres. Daarna kun je hier inloggen.
            </Text>
          ) : null}

          <GradientPrimaryButton
            label={submitting ? 'Bezig…' : 'Registreren'}
            onPress={() => void handleSubmit()}
            loading={submitting}
            disabled={submitting || locked}
          />

          <AuthOrDivider />

          <View style={styles.gap}>
            <GradientOutlineButton
              label="Inloggen"
              href="/login"
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
    position: 'relative',
    marginBottom: 14,
  },
  passwordInput: {
    marginBottom: 0,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: 14,
  },
  error: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    color: Brand.primary,
    marginBottom: 12,
  },
  success: {
    fontFamily: FontFamily.body,
    fontSize: 15,
    marginBottom: 12,
    lineHeight: 22,
  },
  gap: {
    marginBottom: 12,
  },
});

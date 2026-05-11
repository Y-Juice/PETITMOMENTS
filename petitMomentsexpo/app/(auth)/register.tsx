import { Link } from 'expo-router';
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

import { Brand } from '@/constants/theme';
import { FontFamily } from '@/constants/typography';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';

const MIN_PASSWORD = 6;

export default function RegisterScreen() {
  const { signUpWithEmail } = useAuth();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const muted = useThemeColor({}, 'icon');
  const tint = useThemeColor({}, 'tint');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmationHint, setConfirmationHint] = useState(false);

  const handleSubmit = useCallback(async () => {
    const e = email.trim();
    setFormError(null);
    setConfirmationHint(false);
    if (!e.includes('@')) {
      setFormError('Gebruik een geldig e-mailadres.');
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setFormError(`Wachtwoord minimaal ${MIN_PASSWORD} tekens.`);
      return;
    }

    setSubmitting(true);
    const { error, needsConfirmation } = await signUpWithEmail(e, password);
    setSubmitting(false);

    if (error) setFormError(error);
    else if (needsConfirmation) setConfirmationHint(true);
  }, [email, password, signUpWithEmail]);

  const inputExtras = Platform.select({
    ios: {
      autoCorrect: false,
      autoCapitalize: 'none' as const,
    },
    default: {},
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <Text style={[styles.logoPetit, { color: Brand.primary }]}>petit</Text>
          <Text style={[styles.logoMoments, { color: Brand.primary }]}>moments</Text>
          <Text style={[styles.heading, { color: textColor }]}>Account aanmaken</Text>
          <Text style={[styles.sub, { color: muted }]}>Maak een gratis account om aan de slag te gaan.</Text>

          <Text style={[styles.label, { color: textColor }]}>E-mail</Text>
          <TextInput
            style={[styles.field, { color: textColor, borderColor: muted }]}
            placeholder="jan@voorbeeld.nl"
            placeholderTextColor={`${muted}99`}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            editable={!confirmationHint}
            {...inputExtras}
          />

          <Text style={[styles.label, { color: textColor }]}>Wachtwoord</Text>
          <TextInput
            style={[styles.field, { color: textColor, borderColor: muted }]}
            placeholder="••••••••"
            placeholderTextColor={`${muted}99`}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password-new"
            textContentType="newPassword"
            editable={!confirmationHint}
            {...inputExtras}
          />

          {formError ? <Text style={styles.error}>{formError}</Text> : null}
          {confirmationHint ? (
            <Text style={[styles.success, { color: muted }]}>
              Controleer je inbox en bevestig je e-mailadres. Daarna kun je hier inloggen.
            </Text>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: tint, opacity: pressed || submitting || confirmationHint ? 0.85 : 1 },
            ]}
            onPress={() => void handleSubmit()}
            disabled={submitting || confirmationHint}>
            <Text style={styles.primaryBtnLabel}>{submitting ? 'Bezig…' : 'Maak account'}</Text>
          </Pressable>

          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: muted }]}>Al een account? </Text>
            <Link href="/login">
              <Text style={[styles.link, { color: tint }]}>Inloggen</Text>
            </Link>
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
    paddingBottom: 32,
    flexGrow: 1,
  },
  logoPetit: {
    fontFamily: FontFamily.titleBold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  logoMoments: {
    fontFamily: FontFamily.titleBold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.5,
    marginTop: -4,
    marginLeft: '4%',
    marginBottom: 28,
  },
  heading: {
    fontFamily: FontFamily.titleBold,
    fontSize: 22,
    marginBottom: 6,
  },
  sub: {
    fontFamily: FontFamily.body,
    fontSize: 15,
    marginBottom: 24,
  },
  label: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 4,
  },
  field: {
    fontFamily: FontFamily.body,
    fontSize: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    marginBottom: 6,
  },
  error: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    color: Brand.primary,
    marginTop: 8,
    marginBottom: 4,
  },
  success: {
    fontFamily: FontFamily.body,
    fontSize: 15,
    marginTop: 12,
    lineHeight: 22,
  },
  primaryBtn: {
    marginTop: 20,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnLabel: {
    fontFamily: FontFamily.body,
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontFamily: FontFamily.body,
    fontSize: 15,
  },
  link: {
    fontFamily: FontFamily.body,
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

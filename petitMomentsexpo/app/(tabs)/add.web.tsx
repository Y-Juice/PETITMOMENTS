import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FontFamily } from '@/constants/typography';
import { useAuth } from '@/contexts/auth-context';
import { useMoments } from '@/contexts/moments-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { insertMomentInSupabase, uploadMomentImage } from '@/utils/moments-supabase';

export default function AddMomentScreenWeb() {
  const router = useRouter();
  const { session } = useAuth();
  const { addMoment } = useMoments();

  const [imageUri, setImageUri] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [description, setDescription] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const muted = useThemeColor({}, 'icon');
  const cardBackground = useThemeColor({ light: '#FFFFFF', dark: '#171717' }, 'background');
  const borderColor = useThemeColor({ light: '#E2E2E2', dark: '#343434' }, 'text');

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Toegang nodig', 'Geef toegang tot je foto galerij om een moment te uploaden.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? '');
    }
  };

  const resetForm = () => {
    setImageUri('');
    setImageBase64('');
    setDescription('');
    setLocationLabel('');
    setLatitude('');
    setLongitude('');
    setIsPublic(true);
  };

  const submitMoment = async () => {
    const trimmedText = description.trim();
    const trimmedLabel = locationLabel.trim();
    const parsedLat = Number.parseFloat(latitude);
    const parsedLng = Number.parseFloat(longitude);

    if (!imageUri) {
      Alert.alert('Foto ontbreekt', 'Selecteer eerst een foto.');
      return;
    }
    if (!trimmedText) {
      Alert.alert('Tekst ontbreekt', 'Schrijf een korte tekst bij je moment.');
      return;
    }
    if (!trimmedLabel) {
      Alert.alert('Locatie ontbreekt', 'Vul een locatie label in.');
      return;
    }
    if (!Number.isFinite(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      Alert.alert('Ongeldige breedtegraad', 'Gebruik een getal tussen -90 en 90.');
      return;
    }
    if (!Number.isFinite(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      Alert.alert('Ongeldige lengtegraad', 'Gebruik een getal tussen -180 en 180.');
      return;
    }
    if (!session?.user?.id) {
      Alert.alert('Niet ingelogd', 'Log in om een moment op te slaan in Supabase.');
      return;
    }
    if (isSubmitting) {
      return;
    }

    const username = session?.user?.email?.split('@')[0] ?? 'Gebruiker';
    setIsSubmitting(true);

    const { url: uploadedUrl, error: uploadError } = await uploadMomentImage(imageBase64);
    if (uploadError || !uploadedUrl) {
      setIsSubmitting(false);
      Alert.alert('Foto uploaden mislukt', uploadError ?? 'Kon de foto niet uploaden.');
      return;
    }

    const { id: supabaseId, error } = await insertMomentInSupabase({
      mediaUrl: uploadedUrl,
      caption: trimmedText,
      address: trimmedLabel,
      latitude: parsedLat,
      longitude: parsedLng,
      isPublic,
    });

    if (error) {
      setIsSubmitting(false);
      Alert.alert('Opslaan mislukt', error);
      return;
    }

    addMoment({
      id: supabaseId ?? undefined,
      username,
      description: trimmedText,
      imageUrl: uploadedUrl,
      locationLabel: trimmedLabel,
      latitude: parsedLat,
      longitude: parsedLng,
      isPublic,
      ownerId: session.user.id,
    });

    setIsSubmitting(false);
    resetForm();
    Alert.alert('Moment gedeeld', 'Je moment is toegevoegd aan de lijst en kaart.');
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
          <Text style={[styles.label, { color: textColor }]}>Foto</Text>
          <Pressable style={[styles.photoButton, { borderColor }]} onPress={pickPhoto}>
            <Text style={[styles.photoButtonText, { color: textColor }]}>
              {imageUri ? 'Kies andere foto' : 'Foto kiezen'}
            </Text>
          </Pressable>
          {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} contentFit="cover" /> : null}

          <Text style={[styles.label, { color: textColor }]}>Tekst</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Wat wil je delen over deze plek?"
            placeholderTextColor={muted}
            multiline
            style={[styles.input, styles.textArea, { color: textColor, borderColor }]}
          />

          <Text style={[styles.label, { color: textColor }]}>Locatie label</Text>
          <TextInput
            value={locationLabel}
            onChangeText={setLocationLabel}
            placeholder="Bijv. Park van Brussel"
            placeholderTextColor={muted}
            style={[styles.input, { color: textColor, borderColor }]}
          />

          <View style={styles.coordsRow}>
            <View style={styles.coordCol}>
              <Text style={[styles.label, { color: textColor }]}>Breedtegraad</Text>
              <TextInput
                value={latitude}
                onChangeText={setLatitude}
                keyboardType="decimal-pad"
                placeholder="50.8503"
                placeholderTextColor={muted}
                style={[styles.input, { color: textColor, borderColor }]}
              />
            </View>
            <View style={styles.coordCol}>
              <Text style={[styles.label, { color: textColor }]}>Lengtegraad</Text>
              <TextInput
                value={longitude}
                onChangeText={setLongitude}
                keyboardType="decimal-pad"
                placeholder="4.3517"
                placeholderTextColor={muted}
                style={[styles.input, { color: textColor, borderColor }]}
              />
            </View>
          </View>

          <Text style={[styles.label, { color: textColor }]}>Zichtbaarheid</Text>
          <View style={[styles.privacyRow, { borderColor }]}>
            <Pressable
              style={[
                styles.privacyOption,
                isPublic && styles.privacyOptionActive,
              ]}
              onPress={() => setIsPublic(true)}>
              <Text
                style={[
                  styles.privacyOptionText,
                  { color: isPublic ? '#FFFFFF' : textColor },
                ]}>
                Publiek
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.privacyOption,
                !isPublic && styles.privacyOptionActive,
              ]}
              onPress={() => setIsPublic(false)}>
              <Text
                style={[
                  styles.privacyOptionText,
                  { color: !isPublic ? '#FFFFFF' : textColor },
                ]}>
                Privé
              </Text>
            </Pressable>
          </View>
          <Text style={[styles.hint, { color: muted }]}>
            {isPublic
              ? 'Iedereen kan dit moment zien op de homepage en kaart.'
              : 'Alleen jij kan dit moment zien (zichtbaar op je profiel).'}
          </Text>

          <Pressable style={styles.submitButton} onPress={() => void submitMoment()} disabled={isSubmitting}>
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Moment opslaan...' : 'Moment delen'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  label: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    marginBottom: 8,
  },
  photoButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  photoButtonText: {
    fontFamily: FontFamily.body,
    fontSize: 14,
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FontFamily.body,
    fontSize: 14,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  coordsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  coordCol: {
    flex: 1,
  },
  privacyRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  privacyOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyOptionActive: {
    backgroundColor: '#2D6EA8',
  },
  privacyOptionText: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    marginBottom: 14,
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: '#1C7D43',
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.body,
    fontSize: 15,
    fontWeight: '700',
  },
});

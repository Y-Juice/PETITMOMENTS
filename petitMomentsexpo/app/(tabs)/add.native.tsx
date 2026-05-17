import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import MapView from 'react-native-maps/lib/MapView';
import Marker from 'react-native-maps/lib/MapMarker';
import { useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FontFamily } from '@/constants/typography';
import { useAuth } from '@/contexts/auth-context';
import { useMoments } from '@/contexts/moments-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { insertMomentInSupabase } from '@/utils/moments-supabase';

const DEFAULT_COORDINATE = {
  latitude: 50.8503,
  longitude: 4.3517,
};

type Coordinate = {
  latitude: number;
  longitude: number;
};

function formatAddress(place: Location.LocationGeocodedAddress | null): string {
  if (!place) return '';
  const parts = [place.name, place.street, place.city, place.region, place.country];
  return parts.filter(Boolean).join(', ');
}

export default function AddMomentScreenNative() {
  const router = useRouter();
  const mapRef = useRef<ComponentRef<typeof MapView> | null>(null);
  const { session } = useAuth();
  const { addMoment } = useMoments();

  const [imageUri, setImageUri] = useState('');
  const [description, setDescription] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [selectedCoordinate, setSelectedCoordinate] = useState<Coordinate | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const updateCoordinateFields = async (coordinate: Coordinate, fallbackLabel: string) => {
    setSelectedCoordinate(coordinate);
    setLatitude(coordinate.latitude.toFixed(6));
    setLongitude(coordinate.longitude.toFixed(6));

    mapRef.current?.animateToRegion(
      {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      450
    );

    try {
      const reverse = await Location.reverseGeocodeAsync(coordinate);
      const formatted = formatAddress(reverse[0] ?? null);
      setLocationLabel(formatted || fallbackLabel);
    } catch {
      setLocationLabel(fallbackLabel);
    }
  };

  const searchLocation = async () => {
    const query = locationSearch.trim();
    if (!query) {
      Alert.alert('Zoekterm ontbreekt', 'Typ een adres of plaatsnaam om te zoeken.');
      return;
    }

    try {
      setIsSearchingLocation(true);
      const results = await Location.geocodeAsync(query);
      if (!results[0]) {
        Alert.alert('Niets gevonden', 'Probeer een andere zoekterm of zet de pin op de kaart.');
        return;
      }

      await updateCoordinateFields(
        {
          latitude: results[0].latitude,
          longitude: results[0].longitude,
        },
        query
      );
    } catch {
      Alert.alert('Zoeken mislukt', 'Kon locatie niet opzoeken. Probeer opnieuw.');
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const useCurrentLocation = async () => {
    try {
      setIsLocating(true);
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Locatie toestemming nodig', 'Sta locatiegebruik toe om je huidige locatie te gebruiken.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      await updateCoordinateFields(
        {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        'Mijn locatie'
      );
    } catch {
      Alert.alert('Locatie niet beschikbaar', 'Kon je huidige locatie niet ophalen.');
    } finally {
      setIsLocating(false);
    }
  };

  const onMapPress = async (coordinate: Coordinate) => {
    await updateCoordinateFields(coordinate, 'Pin op kaart');
  };

  const resetForm = () => {
    setImageUri('');
    setDescription('');
    setLocationSearch('');
    setLocationLabel('');
    setLatitude('');
    setLongitude('');
    setSelectedCoordinate(null);
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
      Alert.alert('Locatie ontbreekt', 'Zoek een locatie, tik op de kaart of gebruik je eigen locatie.');
      return;
    }
    if (!Number.isFinite(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      Alert.alert('Ongeldige breedtegraad', 'De gekozen locatie gaf geen geldige breedtegraad terug.');
      return;
    }
    if (!Number.isFinite(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      Alert.alert('Ongeldige lengtegraad', 'De gekozen locatie gaf geen geldige lengtegraad terug.');
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

    const { id: supabaseId, error } = await insertMomentInSupabase({
      mediaUrl: imageUri,
      caption: trimmedText,
      address: trimmedLabel,
      latitude: parsedLat,
      longitude: parsedLng,
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
      imageUrl: imageUri,
      locationLabel: trimmedLabel,
      latitude: parsedLat,
      longitude: parsedLng,
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

          <Text style={[styles.label, { color: textColor }]}>Locatie zoeken</Text>
          <View style={styles.searchRow}>
            <TextInput
              value={locationSearch}
              onChangeText={setLocationSearch}
              placeholder="Zoek op adres of plaats"
              placeholderTextColor={muted}
              style={[styles.input, styles.searchInput, { color: textColor, borderColor }]}
            />
            <Pressable style={styles.secondaryButton} onPress={searchLocation} disabled={isSearchingLocation}>
              <Text style={styles.secondaryButtonText}>
                {isSearchingLocation ? 'Zoeken...' : 'Zoek'}
              </Text>
            </Pressable>
          </View>

          <Pressable style={styles.secondaryButtonFull} onPress={useCurrentLocation} disabled={isLocating}>
            <Text style={styles.secondaryButtonText}>
              {isLocating ? 'Locatie ophalen...' : 'Gebruik mijn locatie'}
            </Text>
          </Pressable>

          <Text style={[styles.label, { color: textColor }]}>Kies op kaart</Text>
          <View style={[styles.mapWrap, { borderColor }]}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                latitude: DEFAULT_COORDINATE.latitude,
                longitude: DEFAULT_COORDINATE.longitude,
                latitudeDelta: 0.06,
                longitudeDelta: 0.06,
              }}
              onPress={(event) => onMapPress(event.nativeEvent.coordinate)}>
              {selectedCoordinate ? (
                <Marker
                  coordinate={selectedCoordinate}
                  draggable
                  onDragEnd={(event) => onMapPress(event.nativeEvent.coordinate)}
                />
              ) : null}
            </MapView>
          </View>
          <Text style={[styles.hint, { color: muted }]}>
            Tip: tik op de kaart of sleep de pin om de exacte locatie te zetten.
          </Text>

          <Text style={[styles.label, { color: textColor }]}>Gekozen locatie</Text>
          <TextInput
            value={locationLabel}
            onChangeText={setLocationLabel}
            placeholder="Adres wordt automatisch ingevuld"
            placeholderTextColor={muted}
            style={[styles.input, { color: textColor, borderColor }]}
          />

          <View style={styles.coordsRow}>
            <View style={styles.coordCol}>
              <Text style={[styles.label, { color: textColor }]}>Breedtegraad</Text>
              <TextInput
                value={latitude}
                editable={false}
                placeholder="Nog niet gekozen"
                placeholderTextColor={muted}
                style={[styles.input, styles.readonlyInput, { color: textColor, borderColor }]}
              />
            </View>
            <View style={styles.coordCol}>
              <Text style={[styles.label, { color: textColor }]}>Lengtegraad</Text>
              <TextInput
                value={longitude}
                editable={false}
                placeholder="Nog niet gekozen"
                placeholderTextColor={muted}
                style={[styles.input, styles.readonlyInput, { color: textColor, borderColor }]}
              />
            </View>
          </View>

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
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
  },
  secondaryButton: {
    backgroundColor: '#2D6EA8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryButtonFull: {
    backgroundColor: '#2D6EA8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.body,
    fontSize: 14,
    fontWeight: '700',
  },
  mapWrap: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    height: 220,
    marginBottom: 8,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  hint: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    marginBottom: 14,
  },
  coordsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  coordCol: {
    flex: 1,
  },
  readonlyInput: {
    backgroundColor: '#F5F5F5',
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

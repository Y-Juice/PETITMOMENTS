import { BlurView } from 'expo-blur';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { setStatusBarStyle } from 'expo-status-bar';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FontFamily } from '@/constants/typography';
import { useMoments } from '@/contexts/moments-context';

const CARD_BG = '#C84E3D';
const BADGE_FG = '#1A1A1A';
const DIM_OVERLAY = 'rgba(0, 0, 0, 0.42)';

type MomentDetailOverlayValue = {
  presentMomentById: (id: string) => void;
  dismiss: () => void;
};

const MomentDetailOverlayContext = createContext<MomentDetailOverlayValue | undefined>(
  undefined,
);

export function MomentDetailOverlayProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const visible = openId !== null;

  const { moments, loading } = useMoments();

  const moment = useMemo(() => {
    if (!openId) return undefined;
    return moments.find((m) => m.id === openId);
  }, [openId, moments]);

  const presentMomentById = useCallback((id: string) => {
    const t = String(id).trim();
    if (t) setOpenId(t);
  }, []);

  const dismiss = useCallback(() => {
    setOpenId(null);
  }, []);

  useEffect(() => {
    if (visible) {
      setStatusBarStyle('light');
    } else {
      setStatusBarStyle('auto');
    }
    return () => {
      setStatusBarStyle('auto');
    };
  }, [visible]);

  const value = useMemo(
    (): MomentDetailOverlayValue => ({
      presentMomentById,
      dismiss,
    }),
    [presentMomentById, dismiss],
  );

  const isUp = moment?.scoreDirection === 'up';

  return (
    <MomentDetailOverlayContext.Provider value={value}>
      {children}

      <Modal
        animationType="fade"
        transparent
        visible={visible}
        onRequestClose={dismiss}
        statusBarTranslucent
        {...(Platform.OS === 'ios' ? { presentationStyle: 'overFullScreen' as const } : {})}>
        <View style={styles.modalRoot}>
          <BlurView
            intensity={Platform.OS === 'web' ? 48 : 72}
            tint="dark"
            pointerEvents="none"
            style={StyleSheet.absoluteFillObject}
          />
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFillObject, { backgroundColor: DIM_OVERLAY }]}
          />

          <Pressable
            style={StyleSheet.absoluteFillObject}
            accessibilityLabel="Achtergrond — tik om te sluiten"
            accessibilityRole="button"
            onPress={dismiss}
          />

          <View pointerEvents="box-none" style={styles.foregroundLayer}>
            <SafeAreaView edges={['top']} pointerEvents="box-none" style={styles.safeTop}>
              <View style={styles.topBar} pointerEvents="box-none">
                <View pointerEvents="none" style={styles.topBarSpacer} />
                <Pressable
                  onPress={dismiss}
                  style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Sluiten">
                  <MaterialIcons name="close" size={26} color="#FFFFFF" />
                </Pressable>
              </View>
            </SafeAreaView>

            <View style={styles.cardColumn} pointerEvents="box-none">
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                bounces>
                {!openId ? null : loading && !moment ? (
                  <View style={[styles.stateCard, styles.stateCardCenter]}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                  </View>
                ) : !moment ? (
                  <View style={styles.stateCard}>
                    <Text style={styles.stateText}>Dit moment is niet (meer) gevonden.</Text>
                  </View>
                ) : (
                  <View style={styles.cardShadow}>
                    <View style={styles.card}>
                      <View style={styles.titleRow}>
                        <Text style={styles.title}>{moment.title}</Text>
                        <View style={styles.badge}>
                          <MaterialIcons
                            name={isUp ? 'arrow-upward' : 'arrow-downward'}
                            size={16}
                            color={BADGE_FG}
                          />
                          <Text style={styles.badgeScore}>{moment.score}</Text>
                        </View>
                      </View>

                      {moment.imageUrl ? (
                        <Image
                          source={{ uri: moment.imageUrl }}
                          style={styles.photo}
                          contentFit="cover"
                          transition={200}
                        />
                      ) : (
                        <View style={styles.photoPlaceholder}>
                          <MaterialIcons
                            name="image-not-supported"
                            size={40}
                            color="rgba(255,255,255,0.5)"
                          />
                          <Text style={styles.photoPlaceholderText}>Geen foto</Text>
                        </View>
                      )}

                      <Text style={styles.description}>{moment.description}</Text>
                      <Text style={styles.footer}>
                        {moment.username}, {moment.location.label}
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </MomentDetailOverlayContext.Provider>
  );
}

export function useMomentDetailOverlay(): MomentDetailOverlayValue {
  const ctx = useContext(MomentDetailOverlayContext);
  if (!ctx) {
    throw new Error('useMomentDetailOverlay must be used inside MomentDetailOverlayProvider');
  }
  return ctx;
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  foregroundLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  safeTop: {
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  topBarSpacer: {
    flex: 1,
  },
  closeBtn: {
    padding: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  closeBtnPressed: {
    opacity: 0.75,
  },
  cardColumn: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 4,
  },
  scroll: {
    alignSelf: 'stretch',
    maxHeight: '88%',
  },
  scrollContent: {
    paddingVertical: 12,
  },
  cardShadow: {
    borderRadius: 40,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
    elevation: Platform.OS === 'android' ? 12 : 0,
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.35,
          shadowRadius: 24,
        }
      : {}),
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 40,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 28,
    overflow: 'hidden',
  },
  stateCard: {
    backgroundColor: CARD_BG,
    borderRadius: 40,
    padding: 36,
    minHeight: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stateCardCenter: {
    minHeight: 200,
  },
  stateText: {
    fontFamily: FontFamily.body,
    fontSize: 16,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    lineHeight: 23,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 22,
  },
  title: {
    flex: 1,
    fontFamily: FontFamily.titleBold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.4,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: 20,
    marginTop: 2,
  },
  badgeScore: {
    fontFamily: FontFamily.body,
    fontSize: 15,
    fontWeight: '700',
    color: BADGE_FG,
  },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.12)',
    marginBottom: 22,
  },
  photoPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 22,
  },
  photoPlaceholderText: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  description: {
    fontFamily: FontFamily.body,
    fontSize: 16,
    lineHeight: 25,
    color: '#FFFFFF',
    marginBottom: 24,
  },
  footer: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.92)',
  },
});

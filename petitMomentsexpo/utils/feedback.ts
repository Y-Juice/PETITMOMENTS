import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

/**
 * Subtiele feedback (geluid + trilling) die alleen iets aan de gebruiker
 * communiceert: stemmen, een geslaagde upload of een neutrale tik (uitloggen).
 * Geluiden zijn opzettelijk kort en stil gehouden.
 */
type SoundKey = 'click' | 'success' | 'upvote' | 'downvote';

const SOUND_SOURCES: Record<SoundKey, number> = {
  click: require('../assets/sounds/click.wav'),
  success: require('../assets/sounds/success.wav'),
  upvote: require('../assets/sounds/upvote.wav'),
  downvote: require('../assets/sounds/downvote.wav'),
};

const SOUND_VOLUME = 0.6;

const players: Partial<Record<SoundKey, AudioPlayer>> = {};
let soundEnabled = true;

function getPlayer(key: SoundKey): AudioPlayer | null {
  try {
    if (!players[key]) {
      const player = createAudioPlayer(SOUND_SOURCES[key]);
      player.volume = SOUND_VOLUME;
      players[key] = player;
    }
    return players[key] ?? null;
  } catch {
    return null;
  }
}

function playSound(key: SoundKey) {
  if (!soundEnabled) return;
  try {
    const player = getPlayer(key);
    if (!player) return;
    player.seekTo(0);
    player.play();
  } catch {
    // Geluid is niet kritisch; negeer fouten stilletjes.
  }
}

function triggerHaptic(style: Haptics.ImpactFeedbackStyle) {
  if (Platform.OS === 'web') return;
  try {
    void Haptics.impactAsync(style);
  } catch {
    // Haptics niet beschikbaar op dit toestel.
  }
}

function triggerNotification(type: Haptics.NotificationFeedbackType) {
  if (Platform.OS === 'web') return;
  try {
    void Haptics.notificationAsync(type);
  } catch {
    // Negeer.
  }
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function feedbackUpvote() {
  playSound('upvote');
  triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
}

export function feedbackDownvote() {
  playSound('downvote');
  triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
}

export function feedbackUploadSuccess() {
  playSound('success');
  triggerNotification(Haptics.NotificationFeedbackType.Success);
}

export function feedbackClick() {
  playSound('click');
  triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
}

/** Alleen trilling, geen geluid — voor pin-interacties op de kaart. */
export function feedbackSelectionTap() {
  if (Platform.OS === 'web') return;
  try {
    void Haptics.selectionAsync();
  } catch {
    // Negeer.
  }
}

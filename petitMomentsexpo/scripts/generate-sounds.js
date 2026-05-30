/**
 * Genereert korte, subtiele UI-geluiden als 16-bit PCM WAV-bestanden.
 * Run: node scripts/generate-sounds.js
 *
 * De geluiden worden alleen gebruikt om iets aan de gebruiker te communiceren:
 * - click: uitloggen / neutrale tik
 * - success: geslaagde upload
 * - upvote / downvote: stemmen
 */
const fs = require('node:fs');
const path = require('node:path');

const SAMPLE_RATE = 44100;
const OUT_DIR = path.join(__dirname, '..', 'assets', 'sounds');

function writeWav(filename, samples) {
  const numSamples = samples.length;
  const buffer = Buffer.alloc(44 + numSamples * 2);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  for (let i = 0; i < numSamples; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }

  fs.writeFileSync(filename, buffer);
}

/** Korte attack en release zodat er geen harde klik aan het begin/eind zit. */
function envelope(index, total, attackMs = 6, releaseMs = 60) {
  const t = index / SAMPLE_RATE;
  const dur = total / SAMPLE_RATE;
  const attack = attackMs / 1000;
  const release = releaseMs / 1000;
  const rise = Math.min(1, t / attack);
  const fall = Math.min(1, (dur - t) / release);
  return Math.max(0, Math.min(rise, fall));
}

/** Glijdende sinustoon van freqStart naar freqEnd. */
function tone(freqStart, freqEnd, durMs, volume = 0.25, releaseMs = 60) {
  const n = Math.floor((SAMPLE_RATE * durMs) / 1000);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i += 1) {
    const f = freqStart + (freqEnd - freqStart) * (i / n);
    phase += (2 * Math.PI * f) / SAMPLE_RATE;
    out[i] = Math.sin(phase) * envelope(i, n, 6, releaseMs) * volume;
  }
  return out;
}

function silence(durMs) {
  return new Float32Array(Math.floor((SAMPLE_RATE * durMs) / 1000));
}

function concat(...parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Float32Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

fs.mkdirSync(OUT_DIR, { recursive: true });

// Neutrale tik (uitloggen / generieke knop).
writeWav(path.join(OUT_DIR, 'click.wav'), tone(880, 620, 55, 0.18, 40));

// Stijgende toon = upvote.
writeWav(path.join(OUT_DIR, 'upvote.wav'), tone(520, 880, 130, 0.22, 70));

// Dalende toon = downvote.
writeWav(path.join(OUT_DIR, 'downvote.wav'), tone(620, 300, 150, 0.22, 80));

// Drie stijgende noten = geslaagde upload.
writeWav(
  path.join(OUT_DIR, 'success.wav'),
  concat(
    tone(523, 523, 90, 0.2, 40),
    silence(20),
    tone(659, 659, 90, 0.2, 40),
    silence(20),
    tone(784, 784, 180, 0.22, 120),
  ),
);

console.log('Sound assets geschreven naar', OUT_DIR);

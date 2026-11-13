// Pitch helpers for grading sung notes (US-01). Uses equal temperament with
// A4 = 440 Hz, the same tuning as the audio demo's detector.

const A4_MIDI = 69;
const A4_HZ = 440;
const SEMITONES_PER_OCTAVE = 12;
const CENTS_PER_SEMITONE = 100;

/** A detected note within this many cents of the target counts as a match. */
export const DEFAULT_TOLERANCE_CENTS = 50;

const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B"
] as const;

/** The detector reports 0, a negative value or NaN when nobody is singing. */
function isAudible(hz: number) {
  return Number.isFinite(hz) && hz > 0;
}

/** Fractional MIDI number for a frequency (440 Hz → 69), or null for silence. */
export function frequencyToMidi(hz: number): number | null {
  if (!isAudible(hz)) return null;
  return A4_MIDI + SEMITONES_PER_OCTAVE * Math.log2(hz / A4_HZ);
}

/** Name of the nearest note with its octave, e.g. 60 → "C4", 61 → "C#4". */
export function noteName(midi: number): string {
  const nearest = Math.round(midi);
  const pitchClass =
    ((nearest % SEMITONES_PER_OCTAVE) + SEMITONES_PER_OCTAVE) %
    SEMITONES_PER_OCTAVE;
  // MIDI octaves start at C, and MIDI 0 is C-1, so C4 is 60.
  const octave = Math.floor(nearest / SEMITONES_PER_OCTAVE) - 1;
  return `${NOTE_NAMES[pitchClass]}${octave}`;
}

/**
 * How far a frequency is from the target note, in cents: positive is sharp,
 * negative is flat, 100 cents is one semitone. Null for silence.
 */
export function centsOff(hz: number, targetMidi: number): number | null {
  const midi = frequencyToMidi(hz);
  if (midi === null) return null;
  return (midi - targetMidi) * CENTS_PER_SEMITONE;
}

/** True when the frequency is within the tolerance of the target note. */
export function isOnPitch(
  hz: number,
  targetMidi: number,
  toleranceCents = DEFAULT_TOLERANCE_CENTS
): boolean {
  const cents = centsOff(hz, targetMidi);
  return cents !== null && Math.abs(cents) <= toleranceCents;
}

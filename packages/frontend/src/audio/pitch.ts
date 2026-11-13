const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function frequencyToMidi(hz: number): number | null {
  if (!Number.isFinite(hz) || hz <= 0) return null;
  return 69 + 12 * Math.log2(hz / 440);
}

export function noteName(midi: number): string {
  const n = Math.round(midi);
  return NAMES[((n % 12) + 12) % 12] + (Math.floor(n / 12) - 1);
}

export function centsOff(hz: number, targetMidi: number): number | null {
  if (!Number.isFinite(hz) || hz <= 0) return null;
  const targetHz = 440 * Math.pow(2, (targetMidi - 69) / 12);
  return 1200 * Math.log2(hz / targetHz);
}

export function isOnPitch(
  hz: number,
  targetMidi: number,
  toleranceCents = 50
): boolean {
  const cents = centsOff(hz, targetMidi);
  if (cents === null) return false;
  return Math.abs(cents) <= toleranceCents;
}

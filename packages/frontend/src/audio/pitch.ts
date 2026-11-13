/* eslint-disable @typescript-eslint/no-unused-vars */
// TDD red step: signatures only, so the tests fail on their assertions.

export function frequencyToMidi(hz: number): number | null {
  throw new Error("frequencyToMidi is not implemented yet");
}

export function noteName(midi: number): string {
  throw new Error("noteName is not implemented yet");
}

export function centsOff(hz: number, targetMidi: number): number | null {
  throw new Error("centsOff is not implemented yet");
}

export function isOnPitch(
  hz: number,
  targetMidi: number,
  toleranceCents = 50
): boolean {
  throw new Error("isOnPitch is not implemented yet");
}

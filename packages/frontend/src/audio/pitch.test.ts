import { describe, expect, it } from "vitest";
import { centsOff, frequencyToMidi, isOnPitch, noteName } from "./pitch";

// Requirement (US-01 pitch challenge): given the frequency the microphone
// detected, beatBound names the nearest note, says how many cents sharp (+) or
// flat (-) the student is compared with the target note, and decides whether
// the note counts as a match. Silence or a bad reading never counts as a match.

const A4 = 69; // MIDI number of A4 (440 Hz)
const C4 = 60; // middle C

const silentReadings = [0, -220, Number.NaN, Number.POSITIVE_INFINITY];

describe("frequencyToMidi", () => {
  it("maps 440 Hz to A4 (MIDI 69)", () => {
    expect(frequencyToMidi(440)).toBe(A4);
  });

  it("returns a fractional MIDI number between notes", () => {
    expect(frequencyToMidi(261.63)).toBeCloseTo(C4, 2);
    expect(frequencyToMidi(453)).toBeCloseTo(69.5, 1);
  });

  it("goes up 12 for every doubling of the frequency (one octave)", () => {
    expect(frequencyToMidi(880)).toBe(A4 + 12);
    expect(frequencyToMidi(220)).toBe(A4 - 12);
  });

  it.each(silentReadings)("returns null for a silent reading (%s Hz)", (hz) => {
    expect(frequencyToMidi(hz)).toBeNull();
  });
});

describe("noteName", () => {
  it.each([
    [69, "A4"],
    [60, "C4"],
    [61, "C#4"],
    [59, "B3"],
    [21, "A0"]
  ])("names MIDI %i as %s", (midi, name) => {
    expect(noteName(midi)).toBe(name);
  });

  it("rounds a fractional MIDI number to the nearest note", () => {
    expect(noteName(60.4)).toBe("C4");
    expect(noteName(60.6)).toBe("C#4");
  });
});

describe("centsOff", () => {
  it("is 0 when the student hits the target exactly", () => {
    expect(centsOff(440, A4)).toBe(0);
  });

  it("is positive when the student is sharp", () => {
    expect(centsOff(445, A4)).toBeCloseTo(19.56, 2);
  });

  it("is negative when the student is flat", () => {
    expect(centsOff(435, A4)).toBeCloseTo(-19.79, 2);
  });

  it("is about 100 cents for a whole semitone too high", () => {
    expect(centsOff(466.16, A4)).toBeCloseTo(100, 0);
  });

  it.each(silentReadings)("returns null for a silent reading (%s Hz)", (hz) => {
    expect(centsOff(hz, A4)).toBeNull();
  });
});

describe("isOnPitch", () => {
  const hzAtCents = (cents: number) => 440 * 2 ** (cents / 1200);

  it("accepts a note within the default ±50 cent tolerance", () => {
    expect(isOnPitch(445, A4)).toBe(true);
    expect(isOnPitch(hzAtCents(-49), A4)).toBe(true);
  });

  it("rejects a note just outside the default tolerance", () => {
    expect(isOnPitch(hzAtCents(51), A4)).toBe(false);
    expect(isOnPitch(hzAtCents(-51), A4)).toBe(false);
  });

  it("rejects the right note sung in the wrong octave", () => {
    expect(isOnPitch(880, A4)).toBe(false);
  });

  it("uses a custom tolerance when one is given", () => {
    expect(isOnPitch(445, A4, 10)).toBe(false);
    expect(isOnPitch(445, A4, 25)).toBe(true);
  });

  it.each(silentReadings)("never matches a silent reading (%s Hz)", (hz) => {
    expect(isOnPitch(hz, A4)).toBe(false);
  });
});

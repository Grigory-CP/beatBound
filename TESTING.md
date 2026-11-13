# Testing beatBound (TE7)

> **In progress.** This file currently holds the TDD write-up (#64). The tools, testing levels, mocks and limitations sections are added with #68, after the system tests (#66) and UI tests (#67).

All tests run from the repository root and need no database, no `.env` file and no network (Node.js 22.22+):

```bash
npm install   # once, at the repo root
npm test      # backend tests, then frontend tests
```

## TDD: pitch grading utilities

### Requirement

US-01's pitch challenges need to grade a sung note. The audio demo can detect a frequency, but nothing compared it with a target note. The rule we built with TDD, in `packages/frontend/src/audio/pitch.ts`:

> Given the frequency the microphone detected, name the nearest note, say how many **cents** sharp (+) or flat (−) the student is compared with the target note, and decide whether it counts as a **match**: within ±50 cents by default (half a semitone), or a custom tolerance. Silence or a bad reading (0, negative, NaN, Infinity) never counts as a match.

Each step is its own commit on the `te7-testing` branch, so the history shows the order:

| Step     | Commit                                                                    | `npm test` result                 |
| -------- | ------------------------------------------------------------------------- | --------------------------------- |
| Red      | `b93ea83` – _TE7 TDD (red): failing tests for pitch note/cents utilities_ | **29 failed**, exit code 1        |
| Green    | `422afe7` – _TE7 TDD (green): implement pitch note/cents utilities_       | 29 passed                         |
| Refactor | `4ee883b` – _TE7 TDD (refactor): tidy pitch utilities, tests unchanged_   | 29 passed (test file not changed) |

To see each step: `git show b93ea83`, `git show 422afe7`, `git show 4ee883b`.

### 1. Red: the failing tests

We wrote `pitch.test.ts` first: 29 cases across four functions. `pitch.ts` had only the function signatures, each throwing `not implemented`, so the tests compiled and failed on their assertions rather than on a missing file. A few of the tests:

```ts
it("maps 440 Hz to A4 (MIDI 69)", () => {
  expect(frequencyToMidi(440)).toBe(A4);
});

it("is positive when the student is sharp", () => {
  expect(centsOff(445, A4)).toBeCloseTo(19.56, 2);
});

it("rejects the right note sung in the wrong octave", () => {
  expect(isOnPitch(880, A4)).toBe(false);
});

it.each(silentReadings)("never matches a silent reading (%s Hz)", (hz) => {
  expect(isOnPitch(hz, A4)).toBe(false);
});
```

Output of `npm test` at the Red commit (shortened):

```text
 ❯ src/audio/pitch.test.ts (29 tests | 29 failed) 8ms
     × maps 440 Hz to A4 (MIDI 69) 3ms
     × returns a fractional MIDI number between notes 0ms
     ...
     × never matches a silent reading (Infinity Hz) 0ms

 FAIL  src/audio/pitch.test.ts > frequencyToMidi > maps 440 Hz to A4 (MIDI 69)
Error: frequencyToMidi is not implemented yet
 ❯ frequencyToMidi src/audio/pitch.ts:5:9

 Test Files  1 failed | 1 passed (2)
      Tests  29 failed | 1 passed (30)

npm error Lifecycle script `test` failed with error:
npm error code 1
npm error workspace frontend@1.0.0
```

### 2. Green: the smallest code that passes

The simplest formulas that satisfy the tests (equal temperament, A4 = 440 Hz). The silence check is copied into two functions and the numbers are typed in directly, and we left that for the refactor step:

```ts
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
```

Result: `✓ src/audio/pitch.test.ts (29 tests)`.

### 3. Refactor: clean up with the tests still green

The test file was not touched in this step. Changes to `pitch.ts`:

- **Named constants** `A4_MIDI`, `A4_HZ`, `SEMITONES_PER_OCTAVE`, `CENTS_PER_SEMITONE` replace the magic numbers 69, 440, 12 and 1200.
- **Removed duplication:** one `isAudible(hz)` helper replaces the two copied silence checks.
- **One formula:** `centsOff` now reuses `frequencyToMidi`, so `cents = (midi − targetMidi) × 100` and the log formula lives in only one place.
- **Shared setting:** exported `DEFAULT_TOLERANCE_CENTS = 50`, so the game logic can use the same value instead of a second `50`.
- Added doc comments on each export.

```ts
export function centsOff(hz: number, targetMidi: number): number | null {
  const midi = frequencyToMidi(hz);
  if (midi === null) return null;
  return (midi - targetMidi) * CENTS_PER_SEMITONE;
}
```

Result: still `✓ src/audio/pitch.test.ts (29 tests)`, plus frontend lint and `tsc -b` clean.

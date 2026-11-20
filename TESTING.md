# Testing beatBound (TE7)

beatBound has **100 automated tests** in 12 files: 46 in the backend and 54 in the frontend. They need no database, no `.env` file and no network.

## Tools

| Tool                                                                                                                                                                                                | Used for                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| [Vitest](https://vitest.dev/)                                                                                                                                                                       | Test runner and test doubles (`vi.fn`, `vi.mock`, `vi.stubGlobal`) for every level: unit, system and UI, in both packages      |
| [Supertest](https://github.com/ladjs/supertest)                                                                                                                                                     | Backend system tests: sends real HTTP requests to the Express `app` (from `src/app.js`) without opening a port                 |
| [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) + [user-event](https://testing-library.com/docs/user-event/intro/) + [jsdom](https://github.com/jsdom/jsdom) | Frontend UI tests: renders `<App/>` in a simulated browser, finds elements by role and label, and types and clicks like a user |
| [jest-dom](https://github.com/testing-library/jest-dom)                                                                                                                                             | Readable DOM assertions such as `toBeInTheDocument()`, `toHaveFocus()` (loaded in `packages/frontend/src/test/setup.ts`)       |

## Running tests

Requires Node.js 22.22+. From the repository root:

```bash
npm install            # once, installs both workspaces
npm test               # backend tests, then frontend tests
```

One workspace at a time (the workspace names are `backend` and `frontend`):

```bash
npm test -w backend
npm test -w frontend
npm run test:watch -w backend    # re-run on save
npm run test:watch -w frontend
```

The test settings live in `packages/backend/vitest.config.js` (Node environment, files under `test/**/*.test.js`) and `packages/frontend/vitest.config.ts` (jsdom, files matching `src/**/*.test.{ts,tsx}`).

## Testing levels

| Level  | What it checks                                                                                            | Where                                                        | Tests |
| ------ | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ----- |
| TDD    | A new feature built test-first (red → green → refactor), written up [below](#tdd-pitch-grading-utilities) | `packages/frontend/src/audio/`                               | 29    |
| Unit   | One function or middleware on its own, with everything it calls replaced by a test double                 | `packages/backend/test/unit/`, `packages/frontend/src/auth/` | 30    |
| System | A whole feature through the real HTTP stack: Express app → middleware → route validation → service        | `packages/backend/test/system/`                              | 33    |
| UI     | A user story through the real React app, driven only through what the user sees (labels, roles, text)     | `packages/frontend/src/` (`*.ui.test.tsx`, `App.test.tsx`)   | 8     |

### TDD

| File                               | Covers                                                                                                                         | Tests |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----- |
| `frontend/src/audio/pitch.test.ts` | `frequencyToMidi`, `noteName`, `centsOff`, `isOnPitch`: note names, cents sharp/flat, the ±50-cent match rule, silent readings | 29    |

### Unit

| File                                     | Covers                                                                                                                                | Tests |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `backend/test/unit/requireAuth.test.js`  | Token from the `bb_access` cookie or a `Bearer` header; 401 with no token; attaches the user and a user-scoped client; expired tokens | 5     |
| `backend/test/unit/requireRole.test.js`  | Allowed role passes, any of several roles, 403 `forbidden` otherwise, no user doesn't crash                                           | 4     |
| `backend/test/unit/errorHandler.test.js` | `AppError` → `{ error, message }` with its status; unknown errors → 500 `server_error` without leaking details                        | 4     |
| `frontend/src/auth/fields.test.ts`       | `validateFields` for login and sign-up forms: required fields, class code and invite code formats, username, password length          | 10    |
| `frontend/src/auth/api.test.ts`          | `mapAuthError` (API error codes → the right field message) and `loginBody` (username vs. email identifier)                            | 7     |

### System

Each test sends a real HTTP request with Supertest. The Express app, `requireAuth`, `requireRole`, the route's input checks and the service code all run for real; only the Supabase client (`src/db/supabase.js`) is replaced. The shared test double is `packages/backend/test/helpers/fakeSupabase.js`: it maps fake tokens (`teacher-token`, `student-token`) to a teacher and a student through `auth.getUser` and the `users` lookup, and each test sets the `rpc` or query result it needs.

| File                                            | Feature                                                                                                                                                                                                                                                                                                                                                                                        | Tests |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `backend/test/system/classrooms.system.test.js` | **Teacher creates and lists classrooms.** `POST /api/classrooms` → 201 and `create_classroom` gets the teacher's id and the trimmed name; Bearer header works; no cookie 401; rejected token 401; student 403; empty/blank/missing name 400; database error 500. `GET /api/classrooms` goes through the user-scoped client filtered by teacher; student 403                                    | 11    |
| `backend/test/system/battles.system.test.js`    | **Student plays a battle turn.** `POST /api/battles/:id/turns` → 200 with the `submit_battle_turn` result and the right args; boundary values accepted; 8 invalid bodies → 400 `invalid_turn` and 4 invalid ids → 400 `invalid_id`, all without calling the database; `battle_not_active` → 409, `battle_not_found` / `student_not_found` → 404; unknown error 500; teacher 403; no cookie 401 | 20    |
| `backend/test/system/health.test.js`            | The app loads with the fake env vars; `GET /api/health`, JSON 404 for unknown routes                                                                                                                                                                                                                                                                                                           | 2     |

### UI

The UI tests render the whole `<App/>` inside a `MemoryRouter` and replace `fetch` with a fake backend (`packages/frontend/src/test/fakeApi.ts`) that answers only the calls the test expects. They find elements only by role, label and visible text, type and click with user-event, and never look at component state.

User story: _As a user I want to log in and see the appropriate protected content._

| File                                   | Covers                                                                                                                                                                                                                                                                                                                  | Tests |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `frontend/src/pages/Login.ui.test.tsx` | A teacher logs in → home page shows "Hi, Ms. Samira" and their classrooms (no student content), and every request uses `credentials: "include"`; a student logs in → sees their level progress; wrong password → "Wrong username/email or password." and stays on the login page; empty form → field errors, no request | 4     |
| `frontend/src/pages/Home.ui.test.tsx`  | A logged-out visitor opening `/home` (`/api/auth/me` and the refresh both 401) is sent back to the welcome page; an invalid class code on student sign-up shows the field error without any request; a valid code moves to the next step                                                                                | 3     |
| `frontend/src/App.test.tsx`            | Routing smoke test: an unknown address goes to the welcome page                                                                                                                                                                                                                                                         | 1     |

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

## External services, environment and test data

None are needed:

- **Supabase is never contacted.** Backend tests replace `src/db/supabase.js` (or the services that use it) with `vi.mock` test doubles.
- **No `.env` file.** `src/db/supabase.js` throws if its env vars are missing, so `packages/backend/vitest.config.js` sets fake values (`SUPABASE_URL=http://supabase.test`, test-only keys). They override any real keys in your shell, so a test can't reach a real project by accident.
- **No network.** UI tests stub `fetch` with `vi.stubGlobal`; any request the test didn't expect fails the test. Vitest restores the real `fetch` after each test (`unstubGlobals: true`).
- **No seed data or test database.** Each test builds the few rows it needs (a teacher, a student, a classroom, a battle result) in the test file or in the shared doubles.

## Limitations and future tests

- **Database rules aren't tested.** The RLS policies and SQL functions (`create_classroom`, `record_level_attempt`, `start_battle`, `submit_battle_turn`, `set_battle_status`) run only in Postgres, and the tests mock them. The system tests prove the API sends the right arguments and handles each error, not that the SQL computes damage, XP or unlocks correctly. Future: run them against a local Supabase (`npx supabase start`) or write pgTAP tests.
- **No real-browser end-to-end tests.** jsdom doesn't do layout, CSS or real cookies, so the httpOnly cookie flow is only checked by `credentials: "include"` and the backend tests. Future: Playwright against the running frontend and backend.
- **Audio input isn't tested.** The pitch math is covered, but not microphone capture or pitch detection. Future: feed fake audio streams (recorded or generated tones) into the detector.
- **Not every endpoint has a system test yet:** sign-up/login/refresh, classroom roster and `PATCH`, levels, and battle start/pause/resume/abandon/history. The same `fakeSupabase.js` helper can cover them.
- **No CI yet.** Tests run locally with `npm test`; running them on every push and pull request is TE8.

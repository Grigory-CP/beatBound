// Sample data for the student dashboard.
//
// None of these features have a backend yet, so the dashboard shows this
// fixed data. Each field is typed the way the page expects it, so hooking a
// section up later means replacing one field with an API response:
//
//   streakDays, dailyGoal  -> practice sessions (not built yet)
//   moves                  -> /api/levels plus lesson metadata (minutes, subtitle)
//   week, weeklyGoals      -> practice sessions per day (not built yet)
//   wins                   -> level attempts and badges (not built yet)

export type MoveKind = "next" | "practice" | "challenge" | "review";

export interface DashboardMove {
  id: string;
  kind: MoveKind;
  title: string;
  subtitle: string;
  minutes: number;
  locked: boolean;
}

export interface DashboardDay {
  /** Short label shown under the bar, e.g. "M". */
  label: string;
  /** Full name for screen readers, e.g. "Monday". */
  name: string;
  minutes: number;
  /** False for days that haven't happened yet this week. */
  played: boolean;
}

export type WinKind = "trophy" | "badge";

export interface DashboardWin {
  id: string;
  kind: WinKind;
  title: string;
  detail: string;
  reward: string;
}

export interface DashboardData {
  streakDays: number;
  dailyGoal: { doneMinutes: number; goalMinutes: number };
  moves: DashboardMove[];
  week: DashboardDay[];
  weeklyGoals: { done: number; total: number };
  wins: DashboardWin[];
}

export const PREVIEW_DASHBOARD: DashboardData = {
  streakDays: 6,
  dailyGoal: { doneMinutes: 7, goalMinutes: 10 },
  moves: [
    {
      id: "beat-basics",
      kind: "next",
      title: "Beat basics",
      subtitle: "Quarter notes & rests",
      minutes: 8,
      locked: false
    },
    {
      id: "rhythm-lab",
      kind: "practice",
      title: "Rhythm lab",
      subtitle: "Keep a steady pulse",
      minutes: 5,
      locked: false
    },
    {
      id: "note-ninja",
      kind: "challenge",
      title: "Note ninja",
      subtitle: "Name notes quickly",
      minutes: 6,
      locked: true
    },
    {
      id: "scale-steps",
      kind: "review",
      title: "Scale steps",
      subtitle: "C major refresher",
      minutes: 6,
      locked: false
    }
  ],
  week: [
    { label: "M", name: "Monday", minutes: 8, played: true },
    { label: "T", name: "Tuesday", minutes: 12, played: true },
    { label: "W", name: "Wednesday", minutes: 6, played: true },
    { label: "T", name: "Thursday", minutes: 10, played: true },
    { label: "F", name: "Friday", minutes: 0, played: false },
    { label: "S", name: "Saturday", minutes: 0, played: false },
    { label: "S", name: "Sunday", minutes: 0, played: false }
  ],
  weeklyGoals: { done: 4, total: 5 },
  wins: [
    {
      id: "perfect-timing",
      kind: "trophy",
      title: "Perfect timing",
      detail: "Rhythm Lab · Today",
      reward: "+120 XP"
    },
    {
      id: "three-lessons",
      kind: "badge",
      title: "3 lessons complete",
      detail: "Weekly mission",
      reward: "Badge"
    }
  ]
};

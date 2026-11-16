import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  ChartNoAxesColumn,
  ChevronRight,
  Flame,
  Lock,
  LogOut,
  Music,
  Play,
  Star,
  Target,
  Trophy
} from "lucide-react";
import { Link } from "react-router-dom";
import Mascot from "../components/Mascot";
import NoteGlyph from "../components/NoteGlyph";
import {
  PREVIEW_DASHBOARD,
  type DashboardData,
  type DashboardDay,
  type DashboardMove,
  type DashboardWin,
  type MoveKind
} from "../student/dashboardPreview";
import "./StudentHome.css";

// Student dashboard, matching the student Figma design. Only the student's
// name and logging out are connected so far; everything else comes from
// `data` (sample data by default; see student/dashboardPreview.ts).

const MOVE_LOOK: Record<MoveKind, { eyebrow: string; icon: ReactNode }> = {
  next: { eyebrow: "Next up", icon: <Music size={24} /> },
  practice: { eyebrow: "Practice", icon: <Target size={24} /> },
  challenge: { eyebrow: "Challenge", icon: <Star size={24} /> },
  review: { eyebrow: "Review", icon: <ChartNoAxesColumn size={24} /> }
};

const NAV_ITEMS = ["Dashboard", "Practice", "Progress"] as const;

function ordinal(n: number) {
  const suffix =
    n % 100 >= 11 && n % 100 <= 13
      ? "th"
      : (({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ??
        "th");
  return `${n}${suffix}`;
}

interface StudentHomeProps {
  displayName: string;
  onLogout: () => void;
  data?: DashboardData;
  today?: Date;
}

export default function StudentHome({
  displayName,
  onLogout,
  data = PREVIEW_DASHBOARD,
  today = new Date()
}: StudentHomeProps) {
  const firstName = displayName.trim().split(/\s+/)[0] || displayName;
  const weekday = today.toLocaleDateString("en-US", { weekday: "long" });

  return (
    <div className="student-home theme-student">
      <TopBar
        displayName={displayName}
        initial={firstName.charAt(0).toUpperCase()}
        streakDays={data.streakDays}
        onLogout={onLogout}
      />

      <main className="sh-main">
        <section className="sh-hero" aria-labelledby="sh-hero-title">
          <div className="sh-hero-text">
            <p className="sh-eyebrow sh-eyebrow-brand">
              {weekday} · Your {ordinal(data.streakDays)} day in a row
            </p>
            <h1 id="sh-hero-title">Let&rsquo;s make music, {firstName}!</h1>
            <p className="sh-hero-sub">
              Keep your streak alive with today&rsquo;s{" "}
              {data.dailyGoal.goalMinutes}-minute session.
            </p>
            <button type="button" className="sh-button-primary">
              <Play size={18} aria-hidden="true" />
              Start today&rsquo;s lesson
            </button>
          </div>
          <NoteGlyph className="sh-hero-note" />
          <DailyGoal {...data.dailyGoal} />
        </section>

        <section className="sh-adventure" aria-labelledby="sh-moves-title">
          <div className="sh-section-head">
            <div>
              <p className="sh-eyebrow">Your adventure</p>
              <h2 id="sh-moves-title">Pick your next move</h2>
            </div>
            <button type="button" className="sh-link">
              View progress
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
          <ul className="sh-moves">
            {data.moves.map((move) => (
              <MoveCard key={move.id} move={move} />
            ))}
          </ul>
        </section>

        <div className="sh-panels">
          <WeeklyRhythm week={data.week} goals={data.weeklyGoals} />
          <LatestWins wins={data.wins} />
        </div>
      </main>

      <footer className="sh-footer">
        <div className="sh-footer-inner">
          <p>
            <strong>beatBound</strong>
            <span>Music learning that moves with you.</span>
          </p>
          <button
            type="button"
            className="sh-button-outline"
            onClick={onLogout}
          >
            Switch role
          </button>
        </div>
      </footer>
    </div>
  );
}

function TopBar({
  displayName,
  initial,
  streakDays,
  onLogout
}: {
  displayName: string;
  initial: string;
  streakDays: number;
  onLogout: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the account menu on Escape or a click outside it.
  useEffect(() => {
    if (!menuOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    function onClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [menuOpen]);

  return (
    <header className="sh-topbar">
      <div className="sh-topbar-inner">
        <span className="sh-brand">
          <span className="sh-brand-tile" aria-hidden="true">
            <Music size={22} />
          </span>
          beatBound
        </span>

        <nav className="sh-nav" aria-label="Student">
          {NAV_ITEMS.map((item) =>
            item === "Dashboard" ? (
              <Link key={item} to="/home" aria-current="page">
                {item}
              </Link>
            ) : (
              <button key={item} type="button" title="Coming soon">
                {item}
              </button>
            )
          )}
        </nav>

        <div className="sh-topbar-right">
          <span className="sh-streak">
            <Flame size={18} aria-hidden="true" />
            {streakDays}
            <span className="sh-streak-text"> day streak</span>
          </span>
          <div className="sh-account" ref={menuRef}>
            <button
              type="button"
              className="sh-avatar"
              aria-label={`Account menu for ${displayName}`}
              aria-expanded={menuOpen}
              aria-controls="sh-account-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {initial}
            </button>
            {menuOpen && (
              <div id="sh-account-menu" className="sh-account-menu">
                <p>{displayName}</p>
                <button type="button" onClick={onLogout}>
                  <LogOut size={18} aria-hidden="true" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function DailyGoal({
  doneMinutes,
  goalMinutes
}: {
  doneMinutes: number;
  goalMinutes: number;
}) {
  const share = Math.min(1, doneMinutes / goalMinutes);
  return (
    <div className="sh-goal">
      <div className="sh-goal-mascot">
        <Mascot />
      </div>
      <div className="sh-goal-text">
        <p className="sh-goal-label">Your daily goal</p>
        <p className="sh-goal-value">
          {doneMinutes} / {goalMinutes} min
        </p>
        <span
          className="sh-meter"
          role="progressbar"
          aria-label="Daily goal"
          aria-valuemin={0}
          aria-valuemax={goalMinutes}
          aria-valuenow={doneMinutes}
        >
          <span style={{ width: `${share * 100}%` }} />
        </span>
      </div>
    </div>
  );
}

function MoveCard({ move }: { move: DashboardMove }) {
  const look = MOVE_LOOK[move.kind];
  return (
    <li>
      <button
        type="button"
        className="sh-move"
        data-kind={move.kind}
        disabled={move.locked}
      >
        <span className="sh-move-icon" aria-hidden="true">
          {look.icon}
        </span>
        <span className="sh-move-eyebrow">{look.eyebrow}</span>
        <span className="sh-move-title">{move.title}</span>
        <span className="sh-move-sub">{move.subtitle}</span>
        <span className="sh-move-foot">
          {move.locked ? (
            <>
              Locked
              <Lock size={18} aria-hidden="true" />
            </>
          ) : (
            <>
              {move.minutes} min
              <ChevronRight size={20} aria-hidden="true" />
            </>
          )}
        </span>
      </button>
    </li>
  );
}

function WeeklyRhythm({
  week,
  goals
}: {
  week: DashboardDay[];
  goals: { done: number; total: number };
}) {
  const most = Math.max(1, ...week.map((day) => day.minutes));
  return (
    <section className="sh-panel" aria-labelledby="sh-week-title">
      <div className="sh-panel-head">
        <h2 id="sh-week-title">Weekly rhythm</h2>
        <span className="sh-panel-meta">
          {goals.done} of {goals.total} goals
        </span>
      </div>
      <ol className="sh-week">
        {week.map((day) => (
          <li key={day.name} data-played={day.played}>
            <span
              className="sh-week-bar"
              style={{
                height: day.played
                  ? `${20 + (day.minutes / most) * 60}%`
                  : "45%"
              }}
              aria-hidden="true"
            />
            <span className="sh-week-label" aria-hidden="true">
              {day.label}
            </span>
            <span className="visually-hidden">
              {day.name}:{" "}
              {day.played ? `${day.minutes} minutes` : "not played yet"}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function LatestWins({ wins }: { wins: DashboardWin[] }) {
  return (
    <section className="sh-panel" aria-labelledby="sh-wins-title">
      <div className="sh-panel-head">
        <h2 id="sh-wins-title">Latest wins</h2>
        <button type="button" className="sh-link">
          See all
        </button>
      </div>
      <ul className="sh-wins">
        {wins.map((win) => (
          <li key={win.id}>
            <span
              className="sh-win-icon"
              data-kind={win.kind}
              aria-hidden="true"
            >
              {win.kind === "trophy" ? (
                <Trophy size={22} />
              ) : (
                <Star size={22} />
              )}
            </span>
            <span className="sh-win-text">
              <strong>{win.title}</strong>
              <span>{win.detail}</span>
            </span>
            <span className="sh-win-reward">{win.reward}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

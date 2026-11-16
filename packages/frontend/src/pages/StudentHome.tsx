import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Lock,
  LogOut,
  RotateCw,
  Sparkles,
  Star,
  Users
} from "lucide-react";
import { ApiError, apiFetch } from "../api/client";
import Mascot from "../components/Mascot";
import NoteGlyph from "../components/NoteGlyph";
import "./StudentHome.css";

export interface StudentLevel {
  challenge_id: number;
  level_number: number;
  title: string;
  type: string;
  difficulty: number;
  unlock_level: number;
  xp_reward: number;
  unlocked: boolean;
  completed: boolean;
  best_score: number;
  attempts: number;
}

interface Character {
  level: number;
  xp: number;
}

interface StudentClassroom {
  name: string;
  teacher_name: string;
}

type Quests =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; levels: StudentLevel[]; character: Character };

type QuestStatus = "completed" | "available" | "locked";

// Same rule as record_level_attempt in the database: level = 1 + floor(xp / 100).
const XP_PER_LEVEL = 100;

const MODE_LABEL: Record<string, string> = {
  PITCH: "Sing the notes",
  RHYTHM: "Keep the beat"
};

const STATUS_LABEL: Record<QuestStatus, string> = {
  completed: "Completed",
  available: "Available",
  locked: "Locked"
};

function questStatus(level: StudentLevel): QuestStatus {
  if (level.completed) return "completed";
  return level.unlocked ? "available" : "locked";
}

interface StudentHomeProps {
  displayName: string;
  onLogout: () => void;
}

export default function StudentHome({
  displayName,
  onLogout
}: StudentHomeProps) {
  const navigate = useNavigate();
  const [quests, setQuests] = useState<Quests>({ status: "loading" });
  const [classroom, setClassroom] = useState<StudentClassroom | null>(null);
  const [reloads, setReloads] = useState(0);

  useEffect(() => {
    let active = true;

    apiFetch<{ levels?: StudentLevel[]; character?: Character }>("/api/levels")
      .then((response) => {
        if (!active) return;
        setQuests({
          status: "ready",
          levels: response.levels ?? [],
          character: response.character ?? { level: 1, xp: 0 }
        });
      })
      .catch((error) => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) {
          navigate("/", { replace: true });
          return;
        }
        setQuests({ status: "error" });
      });

    // The class card is a nice-to-have: if it fails, the page still works.
    apiFetch<{ classroom?: StudentClassroom }>("/api/classrooms/mine")
      .then((response) => {
        if (active) setClassroom(response.classroom ?? null);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [navigate, reloads]);

  function retry() {
    setQuests({ status: "loading" });
    setReloads((n) => n + 1);
  }

  const firstName = displayName.trim().split(/\s+/)[0] || displayName;

  return (
    <div className="student-home theme-student">
      <header className="sh-topbar">
        <span className="sh-brand">
          <NoteGlyph className="sh-brand-note" />
          <span className="sh-brand-word">
            beat<span>Bound</span>
          </span>
        </span>
        <div className="sh-player">
          <span className="sh-avatar" aria-hidden="true">
            {firstName.charAt(0).toUpperCase()}
          </span>
          {quests.status === "ready" && (
            <XpMeter character={quests.character} />
          )}
          <button type="button" className="sh-logout" onClick={onLogout}>
            <LogOut size={18} aria-hidden="true" />
            <span className="sh-logout-text">Log out</span>
          </button>
        </div>
      </header>

      <main className="sh-main">
        <section className="sh-hero">
          <p className="sh-hello">Hi, {displayName}</p>
          <h1>Ready for today&apos;s quest?</h1>
          <p className="sh-tagline">
            Sing. Keep the beat. Level up your music journey!
          </p>
        </section>

        {quests.status === "loading" && (
          <p className="sh-status" role="status">
            Loading your quests…
          </p>
        )}

        {quests.status === "error" && (
          <div className="sh-status sh-status-error" role="alert">
            <p>We couldn&apos;t load your quests.</p>
            <button type="button" className="sh-retry" onClick={retry}>
              <RotateCw size={18} aria-hidden="true" />
              Try again
            </button>
          </div>
        )}

        {quests.status === "ready" && (
          <>
            <FeaturedQuest levels={quests.levels} />
            <QuestPath levels={quests.levels} />
            <div className="sh-cards">
              {classroom && (
                <section className="sh-card" aria-labelledby="sh-class-title">
                  <span className="sh-card-icon" aria-hidden="true">
                    <Users size={26} />
                  </span>
                  <div>
                    <h2 id="sh-class-title" className="sh-card-label">
                      Your class
                    </h2>
                    <p className="sh-card-value">{classroom.name}</p>
                    <p className="sh-card-meta">
                      with {classroom.teacher_name}
                    </p>
                  </div>
                </section>
              )}
              <NextUnlock levels={quests.levels} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function XpMeter({ character }: { character: Character }) {
  const xpIntoLevel = character.xp % XP_PER_LEVEL;
  return (
    <div className="sh-xp">
      <span className="sh-xp-level">Level {character.level}</span>
      <span
        className="sh-xp-track"
        role="progressbar"
        aria-label="XP toward the next level"
        aria-valuemin={0}
        aria-valuemax={XP_PER_LEVEL}
        aria-valuenow={xpIntoLevel}
      >
        <span
          className="sh-xp-fill"
          style={{ width: `${(xpIntoLevel / XP_PER_LEVEL) * 100}%` }}
        />
      </span>
      <span className="sh-xp-total">{character.xp} XP</span>
    </div>
  );
}

function FeaturedQuest({ levels }: { levels: StudentLevel[] }) {
  const next = levels.find((level) => level.unlocked && !level.completed);

  if (!next) {
    const locked = levels.find((level) => !level.unlocked);
    return (
      <section className="sh-quest sh-quest-done">
        <div className="sh-quest-art">
          <Mascot />
        </div>
        <div className="sh-quest-body">
          <h2>
            {levels.length === 0
              ? "No quests yet"
              : locked
                ? "Every open quest is done!"
                : "You finished every quest!"}
          </h2>
          <p className="sh-quest-mode">
            {levels.length === 0
              ? "Check back soon for your first quest."
              : locked
                ? `Reach level ${locked.unlock_level} to unlock ${locked.title}.`
                : "Amazing work. New worlds are on the way."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="sh-quest" aria-labelledby="sh-quest-title">
      <div className="sh-quest-art">
        <Mascot />
      </div>
      <div className="sh-quest-body">
        <p className="sh-eyebrow">
          {next.attempts > 0 ? "Keep going" : "Next quest"} · Level{" "}
          {next.level_number}
        </p>
        <h2 id="sh-quest-title">{next.title}</h2>
        <p className="sh-quest-mode">{MODE_LABEL[next.type] ?? next.type}</p>
        <ul className="sh-chips">
          <li>
            <Star size={16} aria-hidden="true" />
            {next.xp_reward} XP
          </li>
          <li>Difficulty {next.difficulty} of 5</li>
          {next.attempts > 0 && <li>Best score {next.best_score}</li>}
        </ul>
        <button type="button" className="sh-cta" disabled>
          Start quest
          <ArrowRight size={20} aria-hidden="true" />
        </button>
        <p className="sh-note">Battles open soon. Warm up your voice!</p>
      </div>
    </section>
  );
}

function QuestPath({ levels }: { levels: StudentLevel[] }) {
  if (levels.length === 0) return null;
  const next = levels.find((level) => level.unlocked && !level.completed);

  return (
    <section className="sh-path" aria-labelledby="sh-path-title">
      <h2 id="sh-path-title">Your quests</h2>
      <ol className="sh-path-list">
        {levels.map((level) => {
          const status = questStatus(level);
          return (
            <li
              key={level.challenge_id}
              className="sh-node"
              data-status={status}
              aria-current={level === next ? "step" : undefined}
            >
              <span className="sh-node-badge" aria-hidden="true">
                {status === "completed" ? (
                  <Check size={22} strokeWidth={3} />
                ) : status === "locked" ? (
                  <Lock size={20} />
                ) : (
                  level.level_number
                )}
              </span>
              <span className="sh-node-title">
                <span className="visually-hidden">
                  Level {level.level_number}:{" "}
                </span>
                {level.title}
              </span>
              <span className="sh-node-status">
                {STATUS_LABEL[status]}
                {status === "completed" && ` · Best ${level.best_score}`}
                {status === "locked" && ` · Level ${level.unlock_level}`}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function NextUnlock({ levels }: { levels: StudentLevel[] }) {
  const locked = levels.find((level) => !level.unlocked);
  return (
    <section className="sh-card" aria-labelledby="sh-unlock-title">
      <span className="sh-card-icon sh-card-icon-night" aria-hidden="true">
        <Sparkles size={26} />
      </span>
      <div>
        <h2 id="sh-unlock-title" className="sh-card-label">
          Next unlock
        </h2>
        <p className="sh-card-value">
          {locked ? locked.title : "Everything is unlocked"}
        </p>
        {locked && (
          <p className="sh-card-meta">Reach level {locked.unlock_level}</p>
        )}
      </div>
    </section>
  );
}

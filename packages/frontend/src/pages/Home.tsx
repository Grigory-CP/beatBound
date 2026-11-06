import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, apiFetch } from "../api/client";
import { logout, me } from "../auth/api";

type User = {
  id: string;
  role: string;
  displayName: string;
};

type Classroom = {
  class_id: number;
  name: string;
  class_code: string;
  is_active: boolean;
};

type Level = {
  challenge_id: number;
  level_number: number;
  title: string;
  type: string;
  unlocked: boolean;
  completed: boolean;
  best_score: number;
};

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [classroomError, setClassroomError] = useState(false);
  const [newClassroomName, setNewClassroomName] = useState("");
  const [creatingClassroom, setCreatingClassroom] = useState(false);
  const [levels, setLevels] = useState<Level[]>([]);
  const [levelsError, setLevelsError] = useState(false);
  const [character, setCharacter] = useState<{
    level: number;
    xp: number;
  } | null>(null);

  const role = user ? String(user.role).toUpperCase() : "";

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const response = await me();
        if (!active) return;
        setUser(response.user);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          navigate("/", { replace: true });
          return;
        }
        setUser(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadUser();
    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    async function loadTeacherData() {
      try {
        const response = await apiFetch<{ classrooms: Classroom[] }>(
          "/api/classrooms"
        );
        setClassrooms(response.classrooms ?? []);
        setClassroomError(false);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          navigate("/", { replace: true });
          return;
        }
        setClassroomError(true);
      }
    }

    async function loadStudentData() {
      try {
        const response = await apiFetch<{
          levels: Level[];
          character: { level: number; xp: number };
        }>("/api/levels");
        setLevels(response.levels ?? []);
        setCharacter(response.character ?? null);
        setLevelsError(false);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          navigate("/", { replace: true });
          return;
        }
        setLevelsError(true);
      }
    }

    if (role === "TEACHER") {
      void loadTeacherData();
    }
    if (role === "STUDENT") {
      void loadStudentData();
    }
  }, [navigate, role, user]);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate("/");
    }
  }

  async function handleCreateClassroom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newClassroomName.trim();
    if (!name) return;

    setCreatingClassroom(true);
    try {
      const response = await apiFetch<{ classroom: Classroom }>(
        "/api/classrooms",
        {
          method: "POST",
          body: JSON.stringify({ name })
        }
      );
      setClassrooms((current) => [response.classroom, ...current]);
      setNewClassroomName("");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        navigate("/", { replace: true });
        return;
      }
      setClassroomError(true);
    } finally {
      setCreatingClassroom(false);
    }
  }

  if (loading) {
    return (
      <div className="home-page">
        <div className="home-shell">
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="home-page">
        <div className="home-shell">
          <p className="data-unavailable">Data Unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="home-shell">
        <header className="home-header">
          <div>
            <p className="home-greeting">Hi, {user.displayName}</p>
            <p className="home-role">{role}</p>
          </div>
          <button type="button" className="home-logout" onClick={handleLogout}>
            Log out
          </button>
        </header>

        {role === "TEACHER" && (
          <section className="dashboard-panel">
            <h2>Your classrooms</h2>
            {classroomError ? (
              <p className="data-unavailable">Data Unavailable</p>
            ) : (
              <div className="dashboard-grid">
                <ul className="classroom-list">
                  {classrooms.length ? (
                    classrooms.map((classroom) => (
                      <li key={classroom.class_id} className="classroom-item">
                        <div>
                          <strong>{classroom.name}</strong>
                          <div className="classroom-meta">
                            Code: {classroom.class_code} ·{" "}
                            {classroom.is_active ? "Active" : "Inactive"}
                          </div>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="classroom-item">No classrooms yet.</li>
                  )}
                </ul>

                <form
                  className="add-classroom"
                  onSubmit={handleCreateClassroom}
                >
                  <input
                    type="text"
                    value={newClassroomName}
                    onChange={(event) =>
                      setNewClassroomName(event.target.value)
                    }
                    placeholder="Classroom name"
                    aria-label="Classroom name"
                  />
                  <button
                    type="submit"
                    className="inline-button"
                    disabled={creatingClassroom}
                  >
                    {creatingClassroom ? "Adding…" : "Add classroom"}
                  </button>
                </form>
              </div>
            )}
          </section>
        )}

        {role === "STUDENT" && (
          <section className="dashboard-panel">
            <h2>Level progress</h2>
            {levelsError ? (
              <p className="data-unavailable">Data Unavailable</p>
            ) : (
              <div className="dashboard-grid">
                <div className="level-summary">
                  <span>Level {character?.level ?? 0}</span>
                  <span>{character?.xp ?? 0} XP</span>
                </div>
                <ul className="level-list">
                  {levels.map((level) => (
                    <li key={level.challenge_id} className="level-item">
                      <div>
                        <strong>
                          #{level.level_number} {level.title}
                        </strong>
                        <div className="level-meta">
                          {level.type} ·{" "}
                          {level.unlocked ? "Unlocked" : "Locked"} ·{" "}
                          {level.completed ? "Completed" : "Not completed"}
                        </div>
                      </div>
                      <div className="level-meta">
                        Best score: {level.best_score}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {role === "PARENT" && (
          <section className="dashboard-panel">
            <h2>Parent dashboard</h2>
            <p>Parent dashboard coming soon.</p>
          </section>
        )}
      </div>
    </div>
  );
}

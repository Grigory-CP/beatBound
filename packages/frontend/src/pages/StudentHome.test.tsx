import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import StudentHome, { type StudentLevel } from "./StudentHome";

const level = (overrides: Partial<StudentLevel>): StudentLevel => ({
  challenge_id: 1,
  level_number: 1,
  title: "First Notes",
  type: "PITCH",
  difficulty: 1,
  unlock_level: 1,
  xp_reward: 50,
  unlocked: true,
  completed: false,
  best_score: 0,
  attempts: 0,
  ...overrides
});

const LEVELS = [
  level({ completed: true, best_score: 850, attempts: 2 }),
  level({
    challenge_id: 2,
    level_number: 2,
    title: "Keep the Beat",
    type: "RHYTHM",
    difficulty: 2,
    xp_reward: 75
  }),
  level({
    challenge_id: 3,
    level_number: 3,
    title: "Echo Cavern",
    unlocked: false,
    unlock_level: 2
  })
];

type Reply = { status: number; body: unknown } | "network-error";

// Fakes the backend: each path gets one reply, or a list of replies in order.
function fakeBackend(routes: Record<string, Reply | Reply[]>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const path = String(input);
    const entry = routes[path];
    const reply = Array.isArray(entry) ? entry.shift() : entry;
    if (!reply) return new Response("{}", { status: 404 });
    if (reply === "network-error") throw new TypeError("Failed to fetch");
    return new Response(JSON.stringify(reply.body), {
      status: reply.status,
      headers: { "Content-Type": "application/json" }
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const levelsReply = (levels: StudentLevel[], xp = 50) => ({
  status: 200,
  body: { levels, character: { level: 1 + Math.floor(xp / 100), xp } }
});

const classroomReply = {
  status: 200,
  body: { classroom: { name: "Period 1 Choir", teacher_name: "Ms. Samira" } }
};

function renderHome(onLogout = vi.fn()) {
  render(
    <MemoryRouter initialEntries={["/home"]}>
      <Routes>
        <Route
          path="/home"
          element={<StudentHome displayName="Nova Kim" onLogout={onLogout} />}
        />
        <Route path="/" element={<p>Welcome page</p>} />
      </Routes>
    </MemoryRouter>
  );
  return onLogout;
}

describe("Student home page", () => {
  it("greets the student and shows their level and XP", async () => {
    fakeBackend({
      "/api/levels": levelsReply(LEVELS, 150),
      "/api/classrooms/mine": classroomReply
    });
    renderHome();

    expect(screen.getByText("Hi, Nova Kim")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Ready for today's quest?" })
    ).toBeInTheDocument();
    expect(await screen.findByText("Level 2")).toBeInTheDocument();
    expect(screen.getByText("150 XP")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "XP toward the next level" })
    ).toHaveAttribute("aria-valuenow", "50");
  });

  it("features the first open quest that isn't completed yet", async () => {
    fakeBackend({
      "/api/levels": levelsReply(LEVELS),
      "/api/classrooms/mine": classroomReply
    });
    renderHome();

    const quest = await screen.findByRole("region", { name: "Keep the Beat" });
    expect(quest).toHaveTextContent("Next quest · Level 2");
    expect(quest).toHaveTextContent("Keep the beat");
    expect(quest).toHaveTextContent("75 XP");
    expect(quest).toHaveTextContent("Difficulty 2 of 5");
    expect(
      within(quest).getByRole("button", { name: "Start quest" })
    ).toBeDisabled();
  });

  it("shows every quest as completed, available or locked", async () => {
    fakeBackend({
      "/api/levels": levelsReply(LEVELS),
      "/api/classrooms/mine": classroomReply
    });
    renderHome();

    const path = await screen.findByRole("region", { name: "Your quests" });
    const [first, second, third] = within(path).getAllByRole("listitem");
    expect(first).toHaveTextContent("First Notes");
    expect(first).toHaveTextContent("Completed · Best 850");
    expect(second).toHaveTextContent("Keep the Beat");
    expect(second).toHaveTextContent("Available");
    expect(second).toHaveAttribute("aria-current", "step");
    expect(third).toHaveTextContent("Echo Cavern");
    expect(third).toHaveTextContent("Locked · Level 2");
  });

  it("shows the student's class and the next quest to unlock", async () => {
    fakeBackend({
      "/api/levels": levelsReply(LEVELS),
      "/api/classrooms/mine": classroomReply
    });
    renderHome();

    const classCard = await screen.findByRole("region", { name: "Your class" });
    expect(classCard).toHaveTextContent("Period 1 Choir");
    expect(classCard).toHaveTextContent("with Ms. Samira");
    const unlockCard = screen.getByRole("region", { name: "Next unlock" });
    expect(unlockCard).toHaveTextContent("Echo Cavern");
    expect(unlockCard).toHaveTextContent("Reach level 2");
  });

  it("still works when the class can't be loaded", async () => {
    fakeBackend({
      "/api/levels": levelsReply(LEVELS),
      "/api/classrooms/mine": { status: 500, body: { error: "server_error" } }
    });
    renderHome();

    expect(
      await screen.findByRole("region", { name: "Your quests" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Your class" })).toBeNull();
  });

  it("celebrates when every open quest is done", async () => {
    fakeBackend({
      "/api/levels": levelsReply([
        level({ completed: true }),
        level({
          challenge_id: 3,
          level_number: 3,
          title: "Echo Cavern",
          unlocked: false,
          unlock_level: 2
        })
      ]),
      "/api/classrooms/mine": classroomReply
    });
    renderHome();

    expect(
      await screen.findByRole("heading", { name: "Every open quest is done!" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Reach level 2 to unlock Echo Cavern.")
    ).toBeInTheDocument();
  });

  it("lets the student try again when the quests fail to load", async () => {
    fakeBackend({
      "/api/levels": ["network-error", levelsReply(LEVELS)],
      "/api/classrooms/mine": classroomReply
    });
    renderHome();
    const user = userEvent.setup();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't load your quests."
    );
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(
      await screen.findByRole("region", { name: "Your quests" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("sends the student to the welcome page when the session has ended", async () => {
    fakeBackend({
      "/api/levels": { status: 401, body: { error: "session_expired" } },
      "/api/auth/refresh": { status: 401, body: { error: "not_logged_in" } },
      "/api/classrooms/mine": {
        status: 401,
        body: { error: "session_expired" }
      }
    });
    renderHome();

    expect(await screen.findByText("Welcome page")).toBeInTheDocument();
  });

  it("logs out from the top bar", async () => {
    fakeBackend({
      "/api/levels": levelsReply(LEVELS),
      "/api/classrooms/mine": classroomReply
    });
    const onLogout = renderHome();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Log out" }));

    expect(onLogout).toHaveBeenCalledOnce();
  });
});

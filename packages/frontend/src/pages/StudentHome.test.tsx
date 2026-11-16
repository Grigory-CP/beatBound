import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import StudentHome from "./StudentHome";
import {
  PREVIEW_DASHBOARD,
  type DashboardData
} from "../student/dashboardPreview";

const MONDAY = new Date(2026, 10, 16);

function renderHome(data?: DashboardData) {
  const onLogout = vi.fn();
  render(
    <MemoryRouter initialEntries={["/home"]}>
      <StudentHome
        displayName="Nova Kim"
        onLogout={onLogout}
        data={data}
        today={MONDAY}
      />
    </MemoryRouter>
  );
  return { onLogout, user: userEvent.setup() };
}

describe("Student dashboard", () => {
  it("greets the student by first name with today's streak", () => {
    renderHome();

    expect(
      screen.getByRole("heading", { level: 1, name: "Let’s make music, Nova!" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Monday · Your 6th day in a row")
    ).toBeInTheDocument();
    expect(
      screen.getByText("day streak", { exact: false }).parentElement
    ).toHaveTextContent("6 day streak");
    expect(
      screen.getByRole("button", { name: "Start today’s lesson" })
    ).toBeInTheDocument();
  });

  it("marks Dashboard as the current page in the top navigation", () => {
    renderHome();

    const nav = screen.getByRole("navigation", { name: "Student" });
    expect(
      within(nav).getByRole("link", { name: "Dashboard" })
    ).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("button", { name: "Practice" })).toBeVisible();
    expect(within(nav).getByRole("button", { name: "Progress" })).toBeVisible();
  });

  it("shows progress toward the daily goal", () => {
    renderHome();

    expect(screen.getByText("7 / 10 min")).toBeInTheDocument();
    const meter = screen.getByRole("progressbar", { name: "Daily goal" });
    expect(meter).toHaveAttribute("aria-valuenow", "7");
    expect(meter).toHaveAttribute("aria-valuemax", "10");
  });

  it("shows four next-move cards, with locked ones disabled", () => {
    renderHome();

    const moves = screen.getByRole("region", { name: "Pick your next move" });
    const cards = within(moves).getAllByRole("button", { name: /min|Locked/ });
    expect(cards).toHaveLength(4);

    const next = within(moves).getByRole("button", { name: /Beat basics/ });
    expect(next).toHaveTextContent("Next up");
    expect(next).toHaveTextContent("Quarter notes & rests");
    expect(next).toHaveTextContent("8 min");
    expect(next).toBeEnabled();

    const locked = within(moves).getByRole("button", { name: /Note ninja/ });
    expect(locked).toHaveTextContent("Locked");
    expect(locked).toBeDisabled();
  });

  it("shows the weekly rhythm chart with a label for every day", () => {
    renderHome();

    const week = screen.getByRole("region", { name: "Weekly rhythm" });
    expect(week).toHaveTextContent("4 of 5 goals");
    const days = within(week).getAllByRole("listitem");
    expect(days).toHaveLength(7);
    expect(days[0]).toHaveTextContent("Monday: 8 minutes");
    expect(days[4]).toHaveTextContent("Friday: not played yet");
  });

  it("lists the latest wins with their rewards", () => {
    renderHome();

    const wins = screen.getByRole("region", { name: "Latest wins" });
    const [first, second] = within(wins).getAllByRole("listitem");
    expect(first).toHaveTextContent("Perfect timing");
    expect(first).toHaveTextContent("Rhythm Lab · Today");
    expect(first).toHaveTextContent("+120 XP");
    expect(second).toHaveTextContent("3 lessons complete");
    expect(second).toHaveTextContent("Badge");
  });

  it("logs out from the account menu, which closes on Escape", async () => {
    const { onLogout, user } = renderHome();
    const avatar = screen.getByRole("button", {
      name: "Account menu for Nova Kim"
    });

    await user.click(avatar);
    expect(avatar).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("button", { name: "Log out" })).toBeNull();

    await user.click(avatar);
    await user.click(screen.getByRole("button", { name: "Log out" }));
    expect(onLogout).toHaveBeenCalledOnce();
  });

  it("leaves the account from the footer's Switch role button", async () => {
    const { onLogout, user } = renderHome();

    await user.click(screen.getByRole("button", { name: "Switch role" }));

    expect(onLogout).toHaveBeenCalledOnce();
  });

  it("renders whatever data it is given, ready for the real API", () => {
    renderHome({
      ...PREVIEW_DASHBOARD,
      streakDays: 1,
      dailyGoal: { doneMinutes: 0, goalMinutes: 15 },
      wins: []
    });

    expect(
      screen.getByText("Monday · Your 1st day in a row")
    ).toBeInTheDocument();
    expect(screen.getByText("0 / 15 min")).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("region", { name: "Latest wins" })
      ).queryAllByRole("listitem")
    ).toHaveLength(0);
  });
});

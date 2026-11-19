import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import App from "../App";
import { requestsSent, stubApi } from "../test/fakeApi";

// UI tests for "As a user I want to log in and see the appropriate protected
// content". The whole app is rendered and driven only through what the user
// sees; the backend is replaced by a stubbed fetch.

const TEACHER = { id: "t-1", role: "TEACHER", displayName: "Ms. Samira" };
const STUDENT = { id: "s-1", role: "STUDENT", displayName: "Nova" };

function openApp(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
  return userEvent.setup();
}

describe("Logging in", () => {
  it("takes a teacher to their home page with their classroom list", async () => {
    const fetchMock = stubApi({
      "POST /api/auth/login": { status: 200, body: { user: TEACHER } },
      "GET /api/auth/me": { status: 200, body: { user: TEACHER } },
      "GET /api/classrooms": {
        status: 200,
        body: {
          classrooms: [
            {
              class_id: 1,
              name: "Room 101",
              class_code: "K7MP2Q",
              is_active: true
            },
            {
              class_id: 2,
              name: "Choir",
              class_code: "R4TWX9",
              is_active: false
            }
          ]
        }
      }
    });
    const user = openApp("/login/teacher");

    await user.type(screen.getByLabelText("Email"), "samira@school.test");
    await user.type(screen.getByLabelText("Password"), "SchoolTest123!");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Hi, Ms. Samira")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Your classrooms" })
    ).toBeInTheDocument();
    expect(await screen.findByText("Room 101")).toBeInTheDocument();
    expect(screen.getByText("Code: K7MP2Q · Active")).toBeInTheDocument();
    expect(screen.getByText("Choir")).toBeInTheDocument();
    expect(screen.getByText("Code: R4TWX9 · Inactive")).toBeInTheDocument();
    // A teacher sees no student content.
    expect(
      screen.queryByRole("heading", { name: "Level progress" })
    ).not.toBeInTheDocument();

    expect(requestsSent(fetchMock)).toEqual([
      "POST /api/auth/login",
      "GET /api/auth/me",
      "GET /api/classrooms"
    ]);
    const [, loginInit] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(loginInit?.body))).toEqual({
      identifier: "samira@school.test",
      password: "SchoolTest123!"
    });
    // Session cookies are httpOnly, so every call must send them.
    for (const [, init] of fetchMock.mock.calls) {
      expect(init?.credentials).toBe("include");
    }
  });

  it("takes a student to their level progress", async () => {
    stubApi({
      "POST /api/auth/login": { status: 200, body: { user: STUDENT } },
      "GET /api/auth/me": { status: 200, body: { user: STUDENT } },
      "GET /api/levels": {
        status: 200,
        body: {
          character: { level: 2, xp: 150 },
          levels: [
            {
              challenge_id: 1,
              level_number: 1,
              title: "First Notes",
              type: "PITCH",
              unlocked: true,
              completed: true,
              best_score: 90
            }
          ]
        }
      }
    });
    const user = openApp("/login/student");

    await user.type(screen.getByLabelText("Username"), "nova_sings");
    await user.type(screen.getByLabelText("Password"), "SchoolTest123!");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Hi, Nova")).toBeInTheDocument();
    expect(await screen.findByText("#1 First Notes")).toBeInTheDocument();
    expect(screen.getByText("Level 2")).toBeInTheDocument();
    expect(screen.getByText("150 XP")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Your classrooms" })
    ).not.toBeInTheDocument();
  });

  it("shows an error and stays on the login page when the password is wrong", async () => {
    const fetchMock = stubApi({
      "POST /api/auth/login": {
        status: 401,
        body: {
          error: "invalid_login",
          message: "Wrong username/email or password"
        }
      }
    });
    const user = openApp("/login/teacher");

    await user.type(screen.getByLabelText("Email"), "samira@school.test");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(
      await screen.findByText("Wrong username/email or password.")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    expect(
      screen.getByRole("heading", { name: "Welcome back" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log in" })).toBeEnabled();
    expect(screen.queryByText(/^Hi,/)).not.toBeInTheDocument();
    // No session refresh and no protected data after a failed login.
    expect(requestsSent(fetchMock)).toEqual(["POST /api/auth/login"]);
  });

  it("asks for missing details without contacting the server", async () => {
    const fetchMock = stubApi({});
    const user = openApp("/login/teacher");

    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(screen.getByText("Please enter your email.")).toBeInTheDocument();
    expect(screen.getByText("Please enter your password.")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveFocus();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

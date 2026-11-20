import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import App from "../App";
import { requestsSent, stubApi } from "../test/fakeApi";

// UI tests for the protected home page and the sign-up form's own checks.
// The whole app is rendered and driven only through what the user sees.

function openApp(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
  return userEvent.setup();
}

describe("Protected home page", () => {
  it("sends a logged-out visitor back to the welcome page", async () => {
    const notLoggedIn = {
      status: 401,
      body: { error: "not_logged_in", message: "not_logged_in" }
    };
    const fetchMock = stubApi({
      "GET /api/auth/me": notLoggedIn,
      "POST /api/auth/refresh": notLoggedIn
    });
    openApp("/home");

    expect(
      await screen.findByRole("navigation", { name: "Choose who you are" })
    ).toBeInTheDocument();
    expect(screen.queryByText(/^Hi,/)).not.toBeInTheDocument();

    // The app tried the session once, tried to refresh it, then gave up.
    expect(requestsSent(fetchMock)).toEqual([
      "GET /api/auth/me",
      "POST /api/auth/refresh"
    ]);
    for (const [, init] of fetchMock.mock.calls) {
      expect(init?.credentials).toBe("include");
    }
  });
});

describe("Student sign-up", () => {
  it("rejects a badly formed class code without sending a request", async () => {
    const fetchMock = stubApi({});
    const user = openApp("/signup/student");

    await user.type(screen.getByLabelText("Your name"), "Nova");
    await user.type(screen.getByLabelText("Class code"), "abc");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      screen.getByText("Class codes are 6 letters and numbers.")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Class code")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    expect(screen.getByLabelText("Class code")).toHaveFocus();
    // Still on the first step: the username field hasn't appeared.
    expect(screen.queryByLabelText("Pick a username")).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("moves on to the next step once the class code is valid", async () => {
    const fetchMock = stubApi({});
    const user = openApp("/signup/student");

    await user.type(screen.getByLabelText("Your name"), "Nova");
    await user.type(screen.getByLabelText("Class code"), "k7mp2q");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByLabelText("Pick a username")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

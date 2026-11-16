import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import App from "../App";

// Bug fix: when the server rejected a student sign-up on the review step,
// the error was set on a field that isn't on that step, so nothing showed.

function serverAnswers(status: number, body: unknown) {
  const fetchMock = vi.fn(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" }
      })
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function fillStudentSignupAndSubmit() {
  render(
    <MemoryRouter initialEntries={["/signup/student"]}>
      <App />
    </MemoryRouter>
  );
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Your name"), "Nova");
  await user.type(screen.getByLabelText("Class code"), "K7MP2Q");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.type(screen.getByLabelText("Pick a username"), "nova_sings");
  await user.type(screen.getByLabelText("Password"), "SchoolTest123!");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "Create account" }));
}

describe("Student sign-up errors from the server", () => {
  it("goes back to the class code step and shows why it was rejected", async () => {
    serverAnswers(400, {
      error: "invalid_class_code",
      message: "That class code doesn't exist"
    });

    await fillStudentSignupAndSubmit();

    expect(
      await screen.findByText("We couldn't find that class code.")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Class code")).toHaveValue("K7MP2Q");
    expect(screen.getByLabelText("Class code")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
  });

  it("goes back to the username step when the username is taken", async () => {
    serverAnswers(409, {
      error: "account_exists",
      message: "That username or email is taken"
    });

    await fillStudentSignupAndSubmit();

    expect(
      await screen.findByText("That account already exists. Try logging in.")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Pick a username")).toHaveValue("nova_sings");
  });

  it("shows the server's reason when the account can't be created", async () => {
    serverAnswers(400, {
      error: "signup_failed",
      message: "Database error creating new user"
    });

    await fillStudentSignupAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't create your account: Database error creating new user"
    );
    expect(
      screen.getByRole("heading", { name: "Does this look right?" })
    ).toBeInTheDocument();
  });
});

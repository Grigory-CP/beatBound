import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import App from "./App";

// Smoke test for the test setup: React, the router and jsdom work together.
describe("App routing", () => {
  it("sends an unknown address back to the welcome page", () => {
    render(
      <MemoryRouter initialEntries={["/no-such-page"]}>
        <App />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("navigation", { name: "Choose who you are" })
    ).toBeInTheDocument();
  });
});

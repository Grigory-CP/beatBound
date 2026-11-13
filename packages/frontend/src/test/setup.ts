import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Unmount whatever a test rendered so every test starts from an empty page.
afterEach(() => {
  cleanup();
});

import { describe, expect, it, vi } from "vitest";
import { AppError, errorHandler } from "../../src/errors.js";

function fakeResponse() {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
}

function handle(error) {
  const res = fakeResponse();
  errorHandler(error, {}, res, vi.fn());
  return res;
}

describe("errorHandler", () => {
  it("sends an AppError's status, code and message as JSON", () => {
    const res = handle(
      new AppError(409, "account_exists", "That username or email is taken")
    );

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: "account_exists",
      message: "That username or email is taken"
    });
  });

  it("uses the code as the message when an AppError has no message", () => {
    const res = handle(new AppError(404, "level_not_found"));

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "level_not_found",
      message: "level_not_found"
    });
  });

  it.each([
    ["a JavaScript error", new Error("column users.secret does not exist")],
    ["a Supabase error object", { message: "permission denied", code: "42501" }]
  ])("turns %s into a generic 500 without leaking details", (_, error) => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = handle(error);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "server_error",
      message: "Something went wrong"
    });
    expect(log).toHaveBeenCalledWith(error); // still logged for developers
  });
});

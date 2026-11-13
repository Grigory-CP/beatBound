import { describe, expect, it, vi } from "vitest";
import { requireRole } from "../../src/middleware/auth.js";
import { AppError } from "../../src/errors.js";

// requireRole doesn't use the database. These mocks make sure the test
// isolates it and never builds real clients.
vi.mock("../../src/db/supabase.js", () => ({ createUserClient: vi.fn() }));
vi.mock("../../src/services/auth.service.js", () => ({
  userFromToken: vi.fn()
}));

function runMiddleware(middleware, user) {
  const next = vi.fn();
  middleware({ user }, {}, next);
  return next;
}

describe("requireRole", () => {
  it("calls next() with no error when the user has the allowed role", () => {
    const next = runMiddleware(requireRole("TEACHER"), { role: "TEACHER" });

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });

  it("allows any of several listed roles", () => {
    const allowParentsAndTeachers = requireRole("TEACHER", "PARENT");

    expect(
      runMiddleware(allowParentsAndTeachers, { role: "PARENT" })
    ).toHaveBeenCalledWith();
    expect(
      runMiddleware(allowParentsAndTeachers, { role: "TEACHER" })
    ).toHaveBeenCalledWith();
  });

  it("passes a 403 forbidden AppError when the role is not allowed", () => {
    const next = runMiddleware(requireRole("TEACHER"), { role: "STUDENT" });

    const [error] = next.mock.calls[0];
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ status: 403, code: "forbidden" });
    expect(error.message).toBe("You can't do that with this account");
  });

  it("rejects a request with no user instead of crashing", () => {
    const next = runMiddleware(requireRole("STUDENT"), undefined);

    expect(next.mock.calls[0][0]).toMatchObject({
      status: 403,
      code: "forbidden"
    });
  });
});

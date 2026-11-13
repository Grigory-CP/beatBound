import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireAuth } from "../../src/middleware/auth.js";
import { createUserClient } from "../../src/db/supabase.js";
import { userFromToken } from "../../src/services/auth.service.js";
import { AppError } from "../../src/errors.js";

// Isolate the middleware: token checking and client creation are mocked.
vi.mock("../../src/db/supabase.js", () => ({ createUserClient: vi.fn() }));
vi.mock("../../src/services/auth.service.js", () => ({
  userFromToken: vi.fn()
}));

const NOVA = { id: "student-nova", role: "STUDENT", displayName: "Nova" };

async function runRequireAuth(req) {
  const next = vi.fn();
  await requireAuth(req, {}, next);
  return next;
}

describe("requireAuth", () => {
  beforeEach(() => {
    vi.mocked(userFromToken).mockResolvedValue(NOVA);
    vi.mocked(createUserClient).mockReturnValue({ scopedTo: "nova" });
  });

  it("returns 401 unauthorized when there is no cookie or header", async () => {
    const next = await runRequireAuth({ headers: {}, cookies: {} });

    expect(next.mock.calls[0][0]).toMatchObject({
      status: 401,
      code: "unauthorized"
    });
    expect(userFromToken).not.toHaveBeenCalled();
  });

  it("reads the bb_access cookie, then attaches the user and a user-scoped client", async () => {
    const req = { headers: {}, cookies: { bb_access: "cookie-token" } };

    const next = await runRequireAuth(req);

    expect(userFromToken).toHaveBeenCalledWith("cookie-token");
    expect(createUserClient).toHaveBeenCalledWith("cookie-token");
    expect(req.user).toEqual(NOVA);
    expect(req.supabase).toEqual({ scopedTo: "nova" });
    expect(next).toHaveBeenCalledWith();
  });

  it("accepts an Authorization: Bearer header when there is no cookie", async () => {
    await runRequireAuth({ headers: { authorization: "Bearer header-token" } });

    expect(userFromToken).toHaveBeenCalledWith("header-token");
  });

  it("ignores an Authorization header that is not a Bearer token", async () => {
    const next = await runRequireAuth({
      headers: { authorization: "Basic dXNlcjpwYXNz" }
    });

    expect(next.mock.calls[0][0]).toMatchObject({ status: 401 });
  });

  it("passes on the error when the token is expired", async () => {
    const expired = new AppError(401, "session_expired");
    vi.mocked(userFromToken).mockRejectedValue(expired);
    const req = { headers: {}, cookies: { bb_access: "old-token" } };

    const next = await runRequireAuth(req);

    expect(next).toHaveBeenCalledWith(expired);
    expect(req.user).toBeUndefined();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminSupabase } from "../../src/db/supabase.js";
import {
  signupStudent,
  signupTeacher
} from "../../src/services/auth.service.js";

// The sign-up checks run before any account is created, so Supabase is
// mocked and the tests assert that it was never called.
vi.mock("../../src/db/supabase.js", () => ({
  adminSupabase: { auth: { admin: { createUser: vi.fn() } }, rpc: vi.fn() },
  newAuthClient: vi.fn()
}));

const longName = "A".repeat(31);

describe("sign-up validation", () => {
  beforeEach(() => {
    vi.mocked(adminSupabase.auth.admin.createUser).mockReset();
  });

  it("rejects a name longer than 30 characters before creating the login", async () => {
    await expect(
      signupTeacher({
        email: "samira@school.test",
        password: "SchoolTest123!",
        displayName: longName
      })
    ).rejects.toMatchObject({ status: 400, code: "invalid_display_name" });
    expect(adminSupabase.auth.admin.createUser).not.toHaveBeenCalled();
  });

  it("applies the same limit to students", async () => {
    await expect(
      signupStudent({
        username: "nova_sings",
        password: "SchoolTest123!",
        displayName: longName,
        classCode: "K7MP2Q"
      })
    ).rejects.toMatchObject({ code: "invalid_display_name" });
    expect(adminSupabase.auth.admin.createUser).not.toHaveBeenCalled();
  });

  it("accepts a 30-character name (it reaches account creation)", async () => {
    vi.mocked(adminSupabase.auth.admin.createUser).mockResolvedValue({
      data: null,
      error: { message: "stop here" }
    });

    await expect(
      signupTeacher({
        email: "samira@school.test",
        password: "SchoolTest123!",
        displayName: "B".repeat(30)
      })
    ).rejects.toMatchObject({ code: "signup_failed" });
    expect(adminSupabase.auth.admin.createUser).toHaveBeenCalledOnce();
  });
});

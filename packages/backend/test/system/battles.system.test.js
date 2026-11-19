import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../src/app.js";
import { adminSupabase } from "../../src/db/supabase.js";
import {
  resetFakeSupabase,
  STUDENT,
  TEACHER
} from "../helpers/fakeSupabase.js";

// System test for "student plays a battle turn": real HTTP request → Express
// app → requireAuth → requireRole("STUDENT") → turn validation →
// battles.service (including its database-error mapping). Only the Supabase
// client (src/db/supabase.js) is a test double.
vi.mock("../../src/db/supabase.js", () => import("../helpers/fakeSupabase.js"));

// Shape returned by public.submit_battle_turn.
const TURN_RESULT = {
  battle: {
    battle_id: 42,
    status: "ACTIVE",
    outcome: null,
    level_number: 1,
    challenge_type: "PITCH",
    player_health: 100,
    player_max_health: 100,
    enemy_health: 60,
    score: 80,
    accuracy: 92.5,
    turns: 1
  },
  turn: { damage_to_enemy: 40, damage_to_player: 0 }
};

const asUser = (user) => `bb_access=${user.token}`;

function playTurn(body, { user = STUDENT, battleId = 42 } = {}) {
  const req = request(app).post(`/api/battles/${battleId}/turns`);
  if (user) req.set("Cookie", asUser(user));
  return req.send(body);
}

describe("student plays a battle turn", () => {
  beforeEach(() => {
    resetFakeSupabase();
  });

  it("submits the turn for the logged-in student and returns the result", async () => {
    adminSupabase.rpc.mockResolvedValue({ data: TURN_RESULT, error: null });

    const res = await playTurn({ score: 80, accuracy: 92.5 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(TURN_RESULT);
    expect(adminSupabase.rpc).toHaveBeenCalledTimes(1);
    expect(adminSupabase.rpc).toHaveBeenCalledWith("submit_battle_turn", {
      p_student_id: STUDENT.id,
      p_battle_id: 42,
      p_score: 80,
      p_accuracy: 92.5
    });
  });

  it("accepts the boundary values score 0 and accuracy 0 or 100", async () => {
    adminSupabase.rpc.mockResolvedValue({ data: TURN_RESULT, error: null });

    expect((await playTurn({ score: 0, accuracy: 0 })).status).toBe(200);
    expect((await playTurn({ score: 0, accuracy: 100 })).status).toBe(200);
  });

  it.each([
    ["accuracy above 100", { score: 80, accuracy: 101 }],
    ["accuracy below 0", { score: 80, accuracy: -1 }],
    ["a negative score", { score: -5, accuracy: 90 }],
    ["a score sent as a string", { score: "80", accuracy: 90 }],
    ["accuracy sent as a string", { score: 80, accuracy: "90" }],
    ["a fractional score", { score: 80.5, accuracy: 90 }],
    ["a missing accuracy", { score: 80 }],
    ["an empty body", {}]
  ])(
    "returns 400 invalid_turn for %s without calling the database",
    async (_label, body) => {
      const res = await playTurn(body);

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ error: "invalid_turn" });
      expect(adminSupabase.rpc).not.toHaveBeenCalled();
    }
  );

  it.each(["abc", "0", "-3", "1.5"])(
    "returns 400 invalid_id for battle id %s",
    async (battleId) => {
      const res = await playTurn({ score: 80, accuracy: 90 }, { battleId });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ error: "invalid_id" });
      expect(adminSupabase.rpc).not.toHaveBeenCalled();
    }
  );

  it.each([
    ["battle_not_active", 409],
    ["battle_not_found", 404],
    ["student_not_found", 404]
  ])("maps the database error %s to HTTP %i", async (code, status) => {
    adminSupabase.rpc.mockResolvedValue({
      data: null,
      error: { message: code, code: "P0001" }
    });

    const res = await playTurn({ score: 80, accuracy: 90 });

    expect(res.status).toBe(status);
    expect(res.body).toEqual({ error: code, message: code });
  });

  it("returns 500 battle_failed for an unexpected database error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    adminSupabase.rpc.mockResolvedValue({
      data: null,
      error: { message: "deadlock detected" }
    });

    const res = await playTurn({ score: 80, accuracy: 90 });

    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({ error: "battle_failed" });
  });

  it("returns 403 forbidden for a teacher", async () => {
    const res = await playTurn({ score: 80, accuracy: 90 }, { user: TEACHER });

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ error: "forbidden" });
    expect(adminSupabase.rpc).not.toHaveBeenCalled();
  });

  it("returns 401 unauthorized when there is no cookie", async () => {
    const res = await playTurn({ score: 80, accuracy: 90 }, { user: null });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ error: "unauthorized" });
    expect(adminSupabase.rpc).not.toHaveBeenCalled();
  });
});

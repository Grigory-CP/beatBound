import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../src/app.js";
import { adminSupabase, createUserClient } from "../../src/db/supabase.js";
import {
  fakeQuery,
  resetFakeSupabase,
  STUDENT,
  TEACHER
} from "../helpers/fakeSupabase.js";

// System test for "teacher creates and lists classrooms": real HTTP request →
// Express app → requireAuth → requireRole → route validation → service.
// Only the Supabase client (src/db/supabase.js) is a test double.
vi.mock("../../src/db/supabase.js", () => import("../helpers/fakeSupabase.js"));

const ROOM_101 = {
  class_id: 7,
  name: "Room 101",
  class_code: "K7MP2Q",
  is_active: true,
  created_at: "2026-11-01T09:00:00Z"
};

const asUser = (user) => `bb_access=${user.token}`;

describe("teacher creates and lists classrooms", () => {
  beforeEach(() => {
    resetFakeSupabase();
  });

  describe("POST /api/classrooms", () => {
    it("creates the classroom for the logged-in teacher with the trimmed name", async () => {
      adminSupabase.rpc.mockResolvedValue({ data: [ROOM_101], error: null });

      const res = await request(app)
        .post("/api/classrooms")
        .set("Cookie", asUser(TEACHER))
        .send({ name: "  Room 101  " });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ classroom: ROOM_101 });
      expect(adminSupabase.auth.getUser).toHaveBeenCalledWith(TEACHER.token);
      expect(adminSupabase.rpc).toHaveBeenCalledTimes(1);
      expect(adminSupabase.rpc).toHaveBeenCalledWith("create_classroom", {
        p_teacher_id: TEACHER.id,
        p_name: "Room 101"
      });
    });

    it("also accepts the token as an Authorization: Bearer header", async () => {
      adminSupabase.rpc.mockResolvedValue({ data: [ROOM_101], error: null });

      const res = await request(app)
        .post("/api/classrooms")
        .set("Authorization", `Bearer ${TEACHER.token}`)
        .send({ name: "Room 101" });

      expect(res.status).toBe(201);
    });

    it("returns 401 unauthorized when there is no cookie", async () => {
      const res = await request(app)
        .post("/api/classrooms")
        .send({ name: "Room 101" });

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({ error: "unauthorized" });
      expect(adminSupabase.auth.getUser).not.toHaveBeenCalled();
      expect(adminSupabase.rpc).not.toHaveBeenCalled();
    });

    it("returns 401 session_expired for a token Supabase rejects", async () => {
      const res = await request(app)
        .post("/api/classrooms")
        .set("Cookie", "bb_access=expired-token")
        .send({ name: "Room 101" });

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({ error: "session_expired" });
      expect(adminSupabase.rpc).not.toHaveBeenCalled();
    });

    it("returns 403 forbidden for a student", async () => {
      const res = await request(app)
        .post("/api/classrooms")
        .set("Cookie", asUser(STUDENT))
        .send({ name: "Room 101" });

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({ error: "forbidden" });
      expect(adminSupabase.rpc).not.toHaveBeenCalled();
    });

    it.each([
      ["an empty name", { name: "" }],
      ["a name of only spaces", { name: "   " }],
      ["no name", {}]
    ])("returns 400 missing_field for %s", async (_label, body) => {
      const res = await request(app)
        .post("/api/classrooms")
        .set("Cookie", asUser(TEACHER))
        .send(body);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: "missing_field",
        message: "name is required"
      });
      expect(adminSupabase.rpc).not.toHaveBeenCalled();
    });

    it("hides a database error behind 500 server_error", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      adminSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: "connection refused" }
      });

      const res = await request(app)
        .post("/api/classrooms")
        .set("Cookie", asUser(TEACHER))
        .send({ name: "Room 101" });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        error: "server_error",
        message: "Something went wrong"
      });
    });
  });

  describe("GET /api/classrooms", () => {
    it("lists the teacher's classrooms through the user-scoped client", async () => {
      const query = fakeQuery({ data: [ROOM_101], error: null });
      const userClient = { from: vi.fn(() => query) };
      createUserClient.mockReturnValue(userClient);

      const res = await request(app)
        .get("/api/classrooms")
        .set("Cookie", asUser(TEACHER));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ classrooms: [ROOM_101] });
      // RLS applies: the query goes through a client built from the user's token.
      expect(createUserClient).toHaveBeenCalledWith(TEACHER.token);
      expect(userClient.from).toHaveBeenCalledWith("classrooms");
      expect(query.eq).toHaveBeenCalledWith("teacher_id", TEACHER.id);
    });

    it("returns 403 forbidden for a student", async () => {
      const res = await request(app)
        .get("/api/classrooms")
        .set("Cookie", asUser(STUDENT));

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({ error: "forbidden" });
    });
  });
});

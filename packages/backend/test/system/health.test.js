import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app.js";

// Smoke test for the test setup: the app loads with the fake env vars from
// vitest.config.js and answers without a real Supabase project or a .env file.
describe("Express app", () => {
  it("answers GET /api/health", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("returns a JSON 404 for unknown routes", async () => {
    const res = await request(app).get("/api/does-not-exist");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "not_found" });
  });
});

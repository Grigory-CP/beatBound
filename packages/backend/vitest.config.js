import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.js"],
    // Fake values so src/db/supabase.js can be imported without a .env file.
    // Tests replace the Supabase client with a test double, so these are never
    // used to reach a real project, and they override any real keys in the shell.
    env: {
      NODE_ENV: "test",
      SUPABASE_URL: "http://supabase.test",
      SUPABASE_SECRET_KEY: "sb_secret_test_only",
      SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_only"
    },
    restoreMocks: true
  }
});

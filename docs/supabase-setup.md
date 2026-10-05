# Supabase Setup

beatBound uses [Supabase](https://supabase.com) (hosted PostgreSQL) for its
database and, later, authentication. The schema lives in this repo as SQL
migrations so every teammate's database matches the class diagram.

```
supabase/
  migrations/20261003000000_initial_schema.sql   all tables, from the TE3 class diagram
  seed.sql                                       starter game content (challenges, enemies)
packages/backend/
  .env.example                                   template for your local .env
  src/db/supabase.js                             shared Supabase client for the backend
  src/scripts/checkDb.js                         connection check (npm run db:check)
```

## One-time project setup (one person does this)

1. Create a free account at supabase.com and click **New project**.
   - Name: `beatBound`, region: **West US**.
   - Save the **database password** somewhere safe (you need it to link).
2. Invite teammates: **Organization settings → Team → Invite**.

## Push the schema (whoever owns the database)

Run from the **repo root**. Docker is not needed.

```bash
npm install -D supabase                 # Supabase CLI, pinned in package.json
npx supabase login                      # opens the browser to authorize
npx supabase init                       # creates supabase/config.toml (answer "N" to the Deno/VS Code prompts)
npx supabase link --project-ref <ref>   # <ref> is in the dashboard URL: supabase.com/dashboard/project/<ref>
npx supabase db push --include-seed     # creates all tables and loads the seed data
```

Check it worked: dashboard → **Table Editor** should list 18 tables, and
`challenges` should have 4 rows.

## Connect the backend (every teammate)

```bash
cd packages/backend
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable              | Where to find it                                                         |
| --------------------- | ------------------------------------------------------------------------ |
| `SUPABASE_URL`        | Project Settings → Data API → Project URL                                |
| `SUPABASE_SECRET_KEY` | Project Settings → API Keys → **Secret keys** (starts with `sb_secret_`) |

Then:

```bash
npm run db:check
```

You should see a table of the 4 seeded challenges and `Enemies: 3`.

> Requires Node 20.6+ (for `--env-file`). Check with `node -v`.

## Rules for working with the database

- **Change the schema only through migrations.** Don't add or edit tables in the
  dashboard UI; the repo would no longer match the real database.
  ```bash
  npx supabase migration new add_something   # creates a new empty .sql file
  # write your SQL in it, then:
  npx supabase db push
  ```
- **Never edit a migration that has already been pushed.** Write a new one.
- **Keep the secret key secret.** It bypasses all security rules. It goes only
  in `packages/backend/.env` (gitignored). Never put it in frontend code, GitHub,
  or a public chat. The frontend will use the **publishable** key
  (`sb_publishable_...`) instead.
- **Keep the class diagram in sync.** If a migration changes a table, update
  `design/umls/beatBound_class_diagram.drawio.png` too.

## How the schema maps to the class diagram

- `User` (abstract) → `users` + one of `students` / `teachers` / `parents`,
  sharing the same id. Passwords are handled by Supabase Auth (bcrypt), so there
  is no `password_hash` column.
- Many-to-many associations become join tables: `parent_students`
  (Parent monitors Student) and `character_unlocks` (Character unlocks Challenge).
- `Challenge` (abstract) → `challenges` + `pitch_challenges` / `rhythm_challenges`.
- Enums (`BattleStatus`, `FriendshipStatus`) → Postgres enum types.
- **Row Level Security is on for every table.** For now only the game content
  (`challenges`, `enemies`, …) is readable through the public API; everything
  else is reachable only from the backend's secret key until we write
  per-role policies with authentication.

## Next sprint: authentication

Open decisions for the team:

- **Student logins without email.** Our NFR says students need only a display
  name and class code, but Supabase Auth signs users in with email, phone, or
  anonymously. Options: (a) username + password where the backend creates a
  hidden internal email, or (b) anonymous sign-in tied to the class code.
- **Profile creation.** A database trigger on `auth.users` can create the
  matching `users` row automatically at sign-up.
- **RLS policies per role.** For example, students read/write their own rows,
  teachers read their classrooms' students and reports, and parents read their
  linked students.

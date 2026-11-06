# beatBound – rules for Claude Code

## Workflow
- Work in this folder on the current branch. Never create git worktrees. Only create/switch branches if I ask.
- Never commit or push to main. Never force-push.
- Before committing, run `git status` and make sure no .env file is staged.
- Run Prettier only on files you changed (`npx prettier --write <files>`), never repo-wide.
- Never edit an already-pushed migration in supabase/migrations; add a new timestamped file instead.
- I usually have the backend running (`npm run dev` in packages/backend, port 4000) and the frontend (`npm run dev` in packages/frontend, port 3000). Reuse them; don't start duplicates.

## Project
- Backend: Express 5 (ES modules) in packages/backend. Routes → middleware (requireAuth/requireRole) → services. Errors via AppError in src/errors.js → `{ error, message }`.
- `adminSupabase` (secret key, bypasses RLS) may only be imported in src/services/. Routes use `req.supabase` (user-scoped client, RLS applies).
- Database: Supabase Postgres; migrations in supabase/migrations, applied with `npx supabase db push`.
- Frontend: React + Vite + TypeScript in packages/frontend; API calls go through src/api/client.ts (`credentials: "include"`, httpOnly cookies, no tokens in JS).
- Docs: beatBound_SRD.md (update Document History, 5.1 API, 5.2 notes, Section 9 AI disclosure when features change). Sequence diagrams are in README.md.

## Testing
- API tests: temporary Windows PowerShell 5.1 scripts (Invoke-RestMethod/Invoke-WebRequest with -UseBasicParsing, separate -WebSession per user, guid-suffixed emails/usernames, password "SchoolTest123!"). Delete them after running.
- Lint: `npx eslint src` in packages/backend; `npm run lint` and `npm run build` in packages/frontend.
Status (Nov 2026): the items below are DONE: profile/classroom RPCs (20261017000000_auth_signup_functions.sql), user-scoped Supabase client + RLS (20261101000000_classrooms_rls.sql, 20261102000000_classroom_policies.sql), and levels/attempts (20261102000100_level_attempts.sql). Kept for history.

# Backend TODO

This document tracks the next backend security and database-integration tasks.
The numbered sections describe the required outcomes; follow the explicit
implementation sequence near the end of this document.

## Implementation context

Read these files before making changes:

- `packages/backend/src/server.js`: Express middleware and route registration.
- `packages/backend/src/db/supabase.js`: currently creates one shared client
  with `SUPABASE_SECRET_KEY`; it therefore bypasses RLS.
- `packages/backend/src/middleware/auth.js`: extracts `bb_access` or a Bearer
  token, validates the user, and attaches `req.user`.
- `packages/backend/src/services/auth.service.js`: creates Auth accounts and
  calls the currently missing profile RPC functions.
- `packages/backend/src/routes/auth.routes.js`: writes and clears access and
  refresh cookies.
- `packages/backend/src/routes/classrooms.routes.js`: calls the currently
  missing `create_classroom` RPC and lists classrooms with the privileged
  shared client.
- `packages/backend/src/errors.js`: centralized `AppError` response handling.
- `supabase/migrations/20261003000000_initial_schema.sql`: current tables,
  constraints, triggers, and RLS state.
- `supabase/seed.sql`: initial challenge and enemy data; do not use it for
  schema or function changes.
- `docs/supabase-setup.md`: setup rules and migration workflow.

Current facts an implementing agent should not have to rediscover:

- `create_student_profile`, `create_teacher_profile`,
  `create_parent_profile`, and `create_classroom` are referenced by JavaScript
  but are not defined in the repository's migrations.
- RLS is enabled on every application table. Only seeded game-content tables
  currently have public read policies.
- The shared secret-key client bypasses RLS. There is no user-scoped client yet.
- Students sign in with a username that is converted to a synthetic Auth email
  under `students.beatbound.app`; the current SQL schema has no `username`
  column. Do not add one silently. Either keep username as an Auth-only login
  identifier or document and migrate an approved persistence requirement.
- The backend requires eight-character passwords even though local Supabase
  configuration currently permits six.
- There is no implemented backend test suite (`npm test` currently fails by
  design). Adding the integration-test harness is part of the work needed to
  satisfy the verification criteria below.
- Do not edit an already-applied migration. Create one or more new timestamped
  migration files.
- Preserve unrelated existing worktree changes.

## Target request flows

Normal authenticated operation:

```text
browser cookie or Bearer access token
  -> requireAuth validates the token
  -> backend creates req.supabase with publishable key + that access token
  -> route queries or calls an RPC through req.supabase
  -> Postgres evaluates the request as authenticated and applies RLS
```

Explicit privileged operation:

```text
reviewed server-only code path
  -> imports adminSupabase created with SUPABASE_SECRET_KEY
  -> performs account provisioning, cleanup, or another documented admin task
  -> backend code/RPC validates authorization because RLS is bypassed
```

There must be no fallback from a missing or invalid user token to the admin
client.

## 1. Add intent-focused comments to backend code

**Goal:** Make authentication, authorization, privileged database access, and
error propagation understandable without commenting obvious JavaScript syntax.

**Work:**

- Document why the shared secret-key Supabase client is restricted to trusted
  administrative operations.
- Document when a user-scoped client must be used instead.
- Explain cookie priority, access-token validation, refresh-token rotation, and
  the `next(err)` error path in the relevant files.
- Add short route comments where authorization depends on `req.user.id` or
  `req.user.role`.
- Add JSDoc only where a function's inputs, return value, or security contract
  is not clear from its name.
- Do not add comments that merely restate individual lines of code.

**Done when:**

- A new contributor can follow signup, login, refresh, logout, and an
  authenticated classroom request from route to database.
- Every use of the secret-key client clearly states why elevated access is
  required.
- Comments describe intent and security assumptions and remain concise.

## 2. Use user-scoped Supabase clients for user actions

**Goal:** Let PostgreSQL Row Level Security enforce ordinary user access instead
of performing every query through the RLS-bypassing secret key.

**Chosen access model:**

Every Supabase request uses a project API key. An admin client is not a request
with no key; it is a client created with the secret key. The effective database
role is determined as follows:

| Supabase credentials                           | Effective role  | RLS behavior                                             |
| ---------------------------------------------- | --------------- | -------------------------------------------------------- |
| Publishable key without a user access token    | `anon`          | Only `anon` grants and policies apply                    |
| Publishable key with a valid user access token | `authenticated` | Policies can use `auth.uid()` and JWT claims             |
| Secret key                                     | `service_role`  | RLS is bypassed; backend code must enforce authorization |

For requests sent to the Express API, the browser does not need to send the
publishable key to Express. It sends its access token through the HttpOnly
`bb_access` cookie (or the supported Bearer header). After validating that
token, the backend creates a request-scoped Supabase client using its configured
publishable key plus the user's access token. Supabase then evaluates queries as
that authenticated user.

If the frontend later calls Supabase directly, it creates its own client using
the same publishable key and the signed-in user's session. A publishable key by
itself never grants authenticated-user access.

The backend must never select admin access because a request omitted its
publishable key or access token. Missing user credentials produce `401`. Admin
access is selected only by an explicit, reviewed server code path that imports
the admin client. A secret key must never be accepted from a request.

**Work:**

- Split the current database client module into two explicit capabilities:
  - an admin client created with `SUPABASE_SECRET_KEY`, used only for account
    provisioning, cleanup, and other reviewed privileged operations;
  - a request-scoped client created with the publishable key and the current
    request's access token, used for normal reads and writes.
- Add `SUPABASE_PUBLISHABLE_KEY` to `.env.example` and startup validation.
- After `requireAuth` extracts the access token, create or expose a user-scoped
  client on the request, such as `req.supabase`, using
  `Authorization: Bearer <access-token>`.
- Treat a missing or invalid access token as unauthenticated; never fall back to
  the admin client.
- Convert classroom listing and later user-owned operations to `req.supabase`.
- Keep admin Auth calls such as `auth.admin.createUser` and compensating account
  cleanup on the admin client.
- Add RLS policies for each converted operation before removing its manual
  authorization fallback.
- Continue filtering queries by the intended owner even when RLS provides a
  second layer of protection.
- Never accept a user ID from the request body when it can be derived from the
  validated access token with `auth.uid()` or `req.user.id`.

**Done when:**

- Ordinary authenticated routes no longer use the secret-key client.
- A teacher can read only their own classrooms through both the API and direct
  user-scoped Supabase requests.
- Students, parents, anonymous users, and unauthenticated users are denied by
  tests where appropriate.
- Admin-client imports are limited and easy to audit.
- Tests cover all three credential states in the table above and prove that a
  missing user token cannot cause an admin fallback.

## 3. Add foundational PostgreSQL RPC functions

**Goal:** Put multi-table operations and invariant enforcement in transactional,
version-controlled database functions.

Create a new migration defining the following functions. Do not create them
manually only in the Supabase dashboard.

### `create_student_profile`

- Accept the new Auth user ID, username, display name, and class code.
- Validate and normalize input.
- Resolve the classroom from the class code without exposing classroom or
  student records to the caller.
- Insert the base `users` row with role `STUDENT` and the `students` subtype row.
- Create initial `game_settings`, `student_reports`, and `characters` rows.
- Satisfy the current required `students.parent_link_code` field with a
  cryptographically random, unique eight-character code matching
  `^[A-Z0-9]{8}$`. Do not expose it from unrelated API responses. A separate
  expiring/hashed invitation model remains follow-up work unless the team
  explicitly approves that schema expansion.
- Fail atomically so partial profiles are not left behind.

### `create_teacher_profile`

- Accept the new Auth user ID, display name, email, and optional school data.
- Insert the base `users` row with role `TEACHER` and the matching `teachers`
  subtype row in one transaction.
- Enforce that the subtype agrees with the base user's role.

### `create_parent_profile`

- Accept the new Auth user ID, display name, and email.
- Insert the base `users` row with role `PARENT` and the matching `parents`
  subtype row in one transaction.
- Enforce that the subtype agrees with the base user's role.

### `create_classroom`

- Derive or verify the calling teacher rather than trusting an arbitrary client
  supplied teacher ID.
- Generate a unique six-character class code with bounded collision retries.
- Insert the classroom and its initial `classroom_reports` row atomically.
- Return the fields required by the `POST /api/classrooms` response.

**Security requirements for all RPCs:**

- Prefer `SECURITY INVOKER` when RLS and caller privileges are sufficient.
- If `SECURITY DEFINER` is necessary, set a safe empty or explicit
  `search_path`, schema-qualify every object, validate `auth.uid()` and role,
  and revoke execution from roles that should not call the function.
- Do not trust role or owner IDs supplied by clients.
- Return stable application error identifiers that the backend can map without
  exposing raw database details.
- Add migration-level comments describing each function's authorization model.

**Done when:**

- All four functions exist in a committed migration and on a reset database.
- Signup and classroom creation work without manually created remote objects.
- Failure tests prove that each multi-table operation rolls back completely.
- Cross-role and cross-user calls are rejected.

## 4. Implement stronger current-session logout

**Goal:** Invalidate the current Supabase session in addition to removing its
cookies from the current browser.

**Work:**

- Read the current session credentials before clearing the cookies.
- Call the appropriate Supabase sign-out/revocation operation for the current
  session only; do not log the user out of every device unless explicitly
  requested.
- Clear `bb_access` and `bb_refresh` even if server-side revocation fails, using
  the same path and cookie attributes used when setting them.
- Make logout idempotent so a request with missing or already-invalid tokens can
  still succeed safely.
- Do not log token values or return Supabase internals to the client.
- Document that an already-issued access JWT may remain valid until its short
  expiration, while revocation prevents continued refresh of the session.

**Done when:**

- The current browser loses both cookies on logout.
- The logged-out refresh token cannot obtain another session.
- Other independently logged-in devices remain signed in.
- Repeated logout requests succeed safely.
- Automated tests cover valid, missing, expired, and already-revoked sessions.

## 5. Reconcile implementation with design diagrams and setup documentation

**Goal:** Keep the checked-in architecture and domain documentation consistent
with the implemented security and data model.

**Relevant artifacts:**

- `design/TE4/beatBound_architecture(TE4).png`
- `design/TE4/beatBound_high_level_design(TE4).png`
- `design/TE4/linktote4final.txt` (link to the TE4 source/final document)
- `design/umls/beatBound_class_diagram(TE3).png`
- The focused UML exports under `design/umls/`
- `docs/supabase-setup.md`

**Decision rule:**

- Update the architecture and high-level-design diagrams if they currently show
  the backend using one unrestricted Supabase connection or omit the chosen
  split between the user-scoped publishable-key client and the server-only
  admin client. Show the access-token flow, RLS boundary, and explicit admin
  path at an appropriate level of detail.
- Update the class diagram only if implementation changes persistent domain
  structure: tables/classes, attributes, enums, subtype constraints,
  relationships, or cardinalities. Adding an RPC or RLS policy alone does not
  require a class-diagram change.
- If implementing secure parent invitations adds an invitation table, or if
  subtype-role enforcement adds persistent columns/relationships, update the
  class diagram and affected focused UML export.
- Update `docs/supabase-setup.md` for the publishable-key environment variable,
  client split, RPC migration, RLS expectations, test/reset commands, and any
  changed setup steps.
- Update diagram source first and then export the PNG. Do not paint text or
  shapes directly onto the checked-in raster. If editable source is unavailable
  or access to the linked TE4 source is blocked, record that limitation in the
  implementation handoff rather than inventing an incompatible source format.

**Done when:**

- The implementation PR states which diagrams were reviewed and why each one
  was updated or intentionally left unchanged.
- Updated diagrams accurately distinguish the publishable-key/user-token path
  from the secret-key/admin path.
- Any schema changes appear in both migrations and the class diagram.
- Setup documentation matches the final environment variables and commands.

## Implementation sequence and scope boundaries

1. Establish a test approach and capture failing authorization/RPC cases.
2. Add the new migration(s): RPCs, required grants, and the minimum RLS policies
   needed by the converted routes.
3. Split the Supabase clients and update `requireAuth` to attach the
   request-scoped client.
4. Convert classroom reads and user-scoped RPC calls; keep only documented
   account-provisioning operations on the admin client.
5. Implement current-session logout revocation.
6. Add intent-focused comments after behavior and security contracts stabilize.
7. Reconcile setup documentation and diagrams using Task 5's decision rule.
8. Run the complete verification checklist.

Do not expand this work into unrelated gameplay routes, frontend UI, avatar or
reward schema, or a full parent-linking feature. Generate the current required
student link code, but leave redemption, expiration, hashing, rotation, and any
new invitation table to a clearly documented follow-up unless the team approves
that domain-model change.

## Required verification

- Add integration tests for authentication, role enforcement, RLS, RPC rollback,
  classroom ownership, refresh rotation, and logout revocation.
- Run a fresh `supabase db reset` to prove the repository alone creates every
  required function and policy.
- Verify the effective roles for publishable-only (`anon`), publishable plus a
  valid user token (`authenticated`), and secret-key (`service_role`) requests.
- Verify that invalid or missing user credentials return `401` and never fall
  back to the admin client.
- Verify a teacher cannot read or create classrooms for another teacher.
- Verify every profile RPC rolls back all of its database writes on failure.
- Verify current-session logout prevents reuse of the refresh token without
  signing out an independent session on another device.
- From the repository root, run `npm run format` after edits.
- Run ESLint and the new backend test suite before merging. If scripts are added
  or renamed, document their exact commands in `packages/backend/package.json`
  and `docs/supabase-setup.md`.

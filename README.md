-- beatBound is an music learning environment for classrooms --
Lead Engineer: Amogh Arora; Scrum Master: Grigory Polunin; Product Owner: Edgar Olozagaste-Olea; Tester: All

## Running locally

- Backend: `cd packages/backend`, copy `.env.example` to `.env` and fill in `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `SUPABASE_PUBLISHABLE_KEY`, then run `npm install` and `npm run dev` to start on `:4000`.
- Frontend: `cd packages/frontend`, run `npm install`, then `npm run dev` to start on `:3000`, which proxies `/api` to `:4000`.

## Access control (TE6)

This phase follows the class example for secure app access: passwords are hashed with bcrypt in Supabase Auth (never stored or sent in plain text, never in a URL); sign-in issues a signed JWT access token (short-lived) plus a refresh token; the tokens are sent as `httpOnly`, `SameSite=Lax` cookies (`Secure` in production) instead of local storage, so page JavaScript cannot read them (XSS protection). The backend also accepts `Authorization: Bearer ...`; `requireAuth` verifies the token on every protected request (401), `requireRole` checks the role (403), and Row Level Security in Postgres is a second check (each request uses a user-scoped DB client; the admin key is only used in `src/services/`). Students log in with a username (mapped to an internal email); teachers and parents use email. Sign-up and login are the only unprotected auth routes.

### Sequence diagrams

```mermaid
sequenceDiagram
    title Sign-up (student example)
    actor U as User
    participant FE as Frontend (React/Vite)
    participant BE as Express API
    participant AUTH as Supabase Auth
    participant DB as Postgres
    U->>FE: Fill sign-up form (name, class code, username, password)
    FE->>FE: Validate fields
    FE->>BE: POST /api/auth/signup/student {username, password, displayName, classCode}
    BE->>BE: Check required fields, password ≥ 8
    alt missing/invalid fields
        BE-->>FE: 400 {error}
    end
    BE->>AUTH: admin.createUser(username@students.beatbound.app, password)
    AUTH->>AUTH: Hash password with bcrypt, store user
    AUTH-->>BE: user id
    BE->>DB: rpc create_student_profile(user id, username, name, class code)
    alt bad class code / username taken
        DB-->>BE: error
        BE->>AUTH: admin.deleteUser(user id) (undo)
        BE-->>FE: 400 invalid_class_code / 409 account_exists
        FE-->>U: Show error on the field
    else profile created
        DB-->>BE: ok (student, character, report, settings rows)
        BE->>AUTH: signInWithPassword
        AUTH-->>BE: JWT access token + refresh token
        BE-->>FE: 201 {user} + Set-Cookie bb_access, bb_refresh (httpOnly)
        FE-->>U: Go to /home
    end
```

```mermaid
sequenceDiagram
    title Sign-in
    actor U as User
    participant FE as Frontend (React/Vite)
    participant BE as Express API
    participant AUTH as Supabase Auth
    participant DB as Postgres
    U->>FE: Enter username/email + password
    FE->>BE: POST /api/auth/login {identifier, password}
    BE->>BE: Username → internal student email (if no "@")
    BE->>AUTH: signInWithPassword(email, password)
    AUTH->>AUTH: bcrypt compare with stored hash
    alt wrong credentials
        AUTH-->>BE: error
        BE-->>FE: 401 invalid_login
        FE-->>U: "Wrong username/email or password"
    else match
        AUTH-->>BE: JWT access token + refresh token
        BE->>AUTH: getUser(access token)
        BE->>DB: Read role + display name (users)
        BE-->>FE: 200 {user} + Set-Cookie bb_access, bb_refresh (httpOnly)
        FE-->>U: Go to /home
    end
```

```mermaid
sequenceDiagram
    title Protected request (teacher views a classroom)
    actor U as Teacher
    participant FE as Frontend (React/Vite)
    participant BE as Express API (requireAuth → requireRole → route)
    participant AUTH as Supabase Auth
    participant DB as Postgres (RLS)
    U->>FE: Open classroom
    FE->>BE: GET /api/classrooms/:id (browser sends bb_access cookie)
    alt no token
        BE-->>FE: 401
    end
    BE->>AUTH: getUser(token) – verify JWT
    alt invalid or expired
        AUTH-->>BE: error
        BE-->>FE: 401
        FE->>BE: POST /api/auth/refresh (bb_refresh cookie)
        alt refresh ok
            BE-->>FE: 200 + new cookies
            FE->>BE: Retry GET /api/classrooms/:id
        else refresh fails
            FE-->>U: Back to start / log in
        end
    end
    BE->>DB: Read user's role
    alt role is not TEACHER
        BE-->>FE: 403 forbidden
    end
    BE->>DB: SELECT classroom via user-scoped client
    DB->>DB: RLS: teacher_id = auth.uid()
    alt not this teacher's class
        DB-->>BE: no rows
        BE-->>FE: 404 classroom_not_found
    else owner
        DB-->>BE: classroom
        BE->>DB: Load roster (service layer)
        BE-->>FE: 200 {classroom, students}
        FE-->>U: Show roster
    end
```

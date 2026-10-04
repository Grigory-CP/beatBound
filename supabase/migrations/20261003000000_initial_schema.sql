-- =============================================================================
-- beatBound: initial schema
-- Source of truth: design/umls/beatBound_class_diagram.drawio.png (TE3)
--
-- Conventions
--   * Table/column names are snake_case versions of the class diagram names.
--   * Accounts live in Supabase Auth (auth.users), which handles password
--     hashing (bcrypt), so there is no password_hash column here.
--   * User -> Student / Teacher / Parent inheritance = one `users` row plus one
--     row in the matching role table, sharing the same id.
--   * Row Level Security is ON for every table and no policies exist yet, so
--     nothing is readable/writable through the public API until policies are
--     added (next sprint, with auth). The backend's secret key bypasses RLS.
-- =============================================================================

-- ---------- Enums -----------------------------------------------------------
create type public.user_role as enum ('STUDENT', 'TEACHER', 'PARENT');
create type public.battle_status as enum ('ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED');
create type public.friendship_status as enum ('PENDING', 'ACCEPTED', 'DECLINED');
create type public.challenge_type as enum ('PITCH', 'RHYTHM');

-- ---------- Helper: keep updated_at current ---------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- Users (abstract User) -------------------------------------------
create table public.users (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  role         public.user_role not null,
  display_name text not null check (char_length(display_name) between 1 and 30),
  email        text,                       -- optional for students (NFR: minimal data on minors)
  created_at   timestamptz not null default now()
);

create table public.teachers (
  user_id     uuid primary key references public.users (user_id) on delete cascade,
  school_name text,
  subject     text
);

create table public.parents (
  user_id              uuid primary key references public.users (user_id) on delete cascade,
  phone_number         text,
  weekly_email_enabled boolean not null default false
);

-- ---------- Classrooms (Teacher manages Classroom 1 -> 0..*) ----------------
create table public.classrooms (
  class_id   bigint generated always as identity primary key,
  teacher_id uuid not null references public.teachers (user_id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 60),
  class_code text not null unique check (class_code ~ '^[A-Z0-9]{6}$'),
  created_at timestamptz not null default now(),
  is_active  boolean not null default true
);
create index classrooms_teacher_id_idx on public.classrooms (teacher_id);

-- ---------- Students (Classroom enrolls Student 1 -> 0..*) ------------------
create table public.students (
  user_id              uuid primary key references public.users (user_id) on delete cascade,
  classroom_id         bigint not null references public.classrooms (class_id) on delete restrict,
  parent_link_code     text not null unique check (parent_link_code ~ '^[A-Z0-9]{8}$'),
  minutes_played_today integer not null default 0 check (minutes_played_today >= 0),
  last_played_at       timestamptz
);
create index students_classroom_id_idx on public.students (classroom_id);

-- Parent monitors Student (0..* -> 1..*): many-to-many join table.
-- Parent configures GameSettings goes through this link (a parent may edit the
-- settings of any student they are linked to).
create table public.parent_students (
  parent_id  uuid not null references public.parents (user_id) on delete cascade,
  student_id uuid not null references public.students (user_id) on delete cascade,
  linked_at  timestamptz not null default now(),
  primary key (parent_id, student_id)
);
create index parent_students_student_id_idx on public.parent_students (student_id);

-- ---------- GameSettings (Student has GameSettings 1 -> 1) ------------------
create table public.game_settings (
  settings_id            bigint generated always as identity primary key,
  student_id             uuid not null unique references public.students (user_id) on delete cascade,
  random_rewards_enabled boolean not null default false,
  sound_enabled          boolean not null default true,
  daily_time_limit_min   integer check (daily_time_limit_min is null or daily_time_limit_min between 1 and 1440),
  updated_at             timestamptz not null default now()
);
create trigger game_settings_updated_at before update on public.game_settings
  for each row execute function public.set_updated_at();

-- ---------- Reports ---------------------------------------------------------
-- Classroom has ClassroomReport (1 -> 1)
create table public.classroom_reports (
  report_id         bigint generated always as identity primary key,
  classroom_id      bigint not null unique references public.classrooms (class_id) on delete cascade,
  average_score     numeric(10, 2) not null default 0 check (average_score >= 0),
  average_accuracy  numeric(5, 2)  not null default 0 check (average_accuracy between 0 and 100),
  total_battles_won integer not null default 0 check (total_battles_won >= 0),
  global_rank       integer check (global_rank > 0),
  updated_at        timestamptz not null default now()
);
create trigger classroom_reports_updated_at before update on public.classroom_reports
  for each row execute function public.set_updated_at();

-- Student owns StudentReport (1 -> 1).
-- ClassroomReport summarizes StudentReport (1 -> 0..*) is derived:
-- student_reports -> students.classroom_id -> classroom_reports.classroom_id
create table public.student_reports (
  report_id        bigint generated always as identity primary key,
  student_id       uuid not null unique references public.students (user_id) on delete cascade,
  total_score      integer not null default 0 check (total_score >= 0),
  battles_played   integer not null default 0 check (battles_played >= 0),
  battles_won      integer not null default 0 check (battles_won >= 0),
  average_accuracy numeric(5, 2) not null default 0 check (average_accuracy between 0 and 100),
  class_rank       integer check (class_rank > 0),
  updated_at       timestamptz not null default now(),
  check (battles_won <= battles_played)
);
create trigger student_reports_updated_at before update on public.student_reports
  for each row execute function public.set_updated_at();

-- ---------- Challenges (abstract Challenge -> Pitch / Rhythm) ---------------
-- Seeded game content, not user-created.
create table public.challenges (
  challenge_id bigint generated always as identity primary key,
  type         public.challenge_type not null,
  title        text not null,
  level_number integer not null unique check (level_number > 0),
  difficulty   integer not null check (difficulty between 1 and 5),
  unlock_level integer not null default 1 check (unlock_level > 0),
  xp_reward    integer not null default 0 check (xp_reward >= 0)
);

create table public.pitch_challenges (
  challenge_id    bigint primary key references public.challenges (challenge_id) on delete cascade,
  target_notes    text[]  not null check (cardinality(target_notes) > 0),   -- e.g. {'C4','E4','G4'}
  tolerance_cents integer not null default 50 check (tolerance_cents between 1 and 100),
  hold_time_ms    integer not null default 500 check (hold_time_ms > 0)
);

create table public.rhythm_challenges (
  challenge_id     bigint primary key references public.challenges (challenge_id) on delete cascade,
  beat_pattern     integer[] not null check (cardinality(beat_pattern) > 0), -- beat offsets in ms
  tempo_bpm        integer not null check (tempo_bpm between 30 and 300),
  timing_window_ms integer not null default 150 check (timing_window_ms > 0)
);

-- ---------- Character (Student controls Character 1 -> 1) ------------------
create table public.characters (
  character_id   bigint generated always as identity primary key,
  student_id     uuid not null unique references public.students (user_id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 30),
  level          integer not null default 1 check (level > 0),
  xp             integer not null default 0 check (xp >= 0),
  max_health     integer not null default 100 check (max_health > 0),
  current_health integer not null default 100 check (current_health >= 0),
  check (current_health <= max_health)
);

-- Character unlocks Challenge (0..* -> 0..*): join table
create table public.character_unlocks (
  character_id bigint not null references public.characters (character_id) on delete cascade,
  challenge_id bigint not null references public.challenges (challenge_id) on delete cascade,
  unlocked_at  timestamptz not null default now(),
  primary key (character_id, challenge_id)
);
create index character_unlocks_challenge_id_idx on public.character_unlocks (challenge_id);

-- ---------- LevelProgress (StudentReport contains, tracks Challenge) --------
create table public.level_progress (
  progress_id       bigint generated always as identity primary key,
  student_report_id bigint not null references public.student_reports (report_id) on delete cascade,
  challenge_id      bigint not null references public.challenges (challenge_id) on delete cascade,
  best_score        integer not null default 0 check (best_score >= 0),
  best_accuracy     numeric(5, 2) not null default 0 check (best_accuracy between 0 and 100),
  attempts          integer not null default 0 check (attempts >= 0),
  completed         boolean not null default false,
  last_played_at    timestamptz,
  unique (student_report_id, challenge_id)
);
create index level_progress_challenge_id_idx on public.level_progress (challenge_id);

-- ---------- Enemy (seeded game content) -------------------------------------
create table public.enemies (
  enemy_id     bigint generated always as identity primary key,
  name         text not null unique,
  max_health   integer not null check (max_health > 0),
  attack_power integer not null check (attack_power >= 0),
  sprite_url   text
);

-- ---------- Battle ----------------------------------------------------------
-- Character fights in Battle (1 -> 0..*), Battle runs Challenge (0..* -> 1),
-- Battle features Enemy (0..* -> 1), Battle has status BattleStatus
create table public.battles (
  battle_id     bigint generated always as identity primary key,
  character_id  bigint not null references public.characters (character_id) on delete cascade,
  challenge_id  bigint not null references public.challenges (challenge_id) on delete restrict,
  enemy_id      bigint not null references public.enemies (enemy_id) on delete restrict,
  status        public.battle_status not null default 'ACTIVE',
  score         integer not null default 0 check (score >= 0),
  accuracy      numeric(5, 2) not null default 0 check (accuracy between 0 and 100),
  player_health integer not null check (player_health >= 0),
  enemy_health  integer not null check (enemy_health >= 0),
  saved_state   jsonb,                      -- snapshot for pause / resume (US-05)
  started_at    timestamptz not null default now(),
  ended_at      timestamptz,
  check (ended_at is null or ended_at >= started_at),
  check ((status in ('COMPLETED', 'ABANDONED')) = (ended_at is not null))
);
create index battles_character_id_idx on public.battles (character_id);
create index battles_challenge_id_idx on public.battles (challenge_id);
create index battles_enemy_id_idx on public.battles (enemy_id);

-- ---------- Friendship (student-only) ---------------------------------------
-- Student sends Friendship (1 -> 0..*), Friendship is sent to Student (0..* -> 1)
create table public.friendships (
  friendship_id bigint generated always as identity primary key,
  requester_id  uuid not null references public.students (user_id) on delete cascade,
  addressee_id  uuid not null references public.students (user_id) on delete cascade,
  status        public.friendship_status not null default 'PENDING',
  created_at    timestamptz not null default now(),
  responded_at  timestamptz,
  check (requester_id <> addressee_id),
  check ((status = 'PENDING') = (responded_at is null))
);
-- one friendship per pair of students, whichever direction it was sent
create unique index friendships_pair_uidx
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index friendships_addressee_id_idx on public.friendships (addressee_id);

-- ---------- Row Level Security ----------------------------------------------
-- Enabled everywhere with no policies = locked down by default.
alter table public.users             enable row level security;
alter table public.teachers          enable row level security;
alter table public.parents           enable row level security;
alter table public.classrooms        enable row level security;
alter table public.students          enable row level security;
alter table public.parent_students   enable row level security;
alter table public.game_settings     enable row level security;
alter table public.classroom_reports enable row level security;
alter table public.student_reports   enable row level security;
alter table public.challenges        enable row level security;
alter table public.pitch_challenges  enable row level security;
alter table public.rhythm_challenges enable row level security;
alter table public.characters        enable row level security;
alter table public.character_unlocks enable row level security;
alter table public.level_progress    enable row level security;
alter table public.enemies           enable row level security;
alter table public.battles           enable row level security;
alter table public.friendships       enable row level security;

-- Game content is public: anyone (even logged out) may read it.
create policy "challenges are readable by everyone" on public.challenges
  for select to anon, authenticated using (true);
create policy "pitch challenges are readable by everyone" on public.pitch_challenges
  for select to anon, authenticated using (true);
create policy "rhythm challenges are readable by everyone" on public.rhythm_challenges
  for select to anon, authenticated using (true);
create policy "enemies are readable by everyone" on public.enemies
  for select to anon, authenticated using (true);

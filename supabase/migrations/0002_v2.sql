-- StudyVerse v2: pomodoro sessions, weekly planner, saved CGPA, note tags.
-- Idempotent: safe to re-run. Run in Supabase Dashboard -> SQL Editor after 0001.

create table if not exists pomodoro_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  started_at timestamptz not null default now(),
  minutes    int not null check (minutes > 0),
  kind       text not null check (kind in ('work', 'break'))
);

create table if not exists planner_blocks (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users (id) on delete cascade,
  weekday   int not null check (weekday between 0 and 6),   -- 0 = Monday
  start_min int not null check (start_min between 0 and 1439),
  end_min   int not null check (end_min > start_min and end_min <= 1440),
  subject   text not null,
  color     text not null default 'blue'
);

create table if not exists gpa_profiles (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  scale     text not null default '10' check (scale in ('10', '4')),
  semesters jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

alter table notes add column if not exists tags text[] not null default '{}';

create index if not exists pomodoro_sessions_user_started_idx on pomodoro_sessions (user_id, started_at desc);
create index if not exists planner_blocks_user_idx on planner_blocks (user_id);
create index if not exists notes_tags_idx on notes using gin (tags);

alter table pomodoro_sessions enable row level security;
alter table planner_blocks    enable row level security;
alter table gpa_profiles      enable row level security;

drop policy if exists "own sessions" on pomodoro_sessions;
create policy "own sessions" on pomodoro_sessions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own blocks" on planner_blocks;
create policy "own blocks" on planner_blocks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own gpa" on gpa_profiles;
create policy "own gpa" on gpa_profiles for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

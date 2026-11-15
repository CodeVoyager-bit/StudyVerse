-- StudyVerse 0003: subjects, resource library, attendance, exams, flashcards, reminders, AI usage, study groups.
-- Idempotent: safe to re-run. Run in Supabase Dashboard -> SQL Editor after 0001 and 0002.

-- ───────────────────────── Tables ─────────────────────────

create table if not exists subjects (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  name              text not null check (char_length(name) between 1 and 60),
  color             text not null default 'blue',
  attendance_target int  not null default 75 check (attendance_target between 1 and 100),
  share_token       text unique,
  created_at        timestamptz not null default now()
);

create table if not exists study_groups (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null check (char_length(name) between 1 and 60),
  description         text check (char_length(description) <= 280),
  owner_id            uuid not null references auth.users (id) on delete cascade,
  invite_code         text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  call_room           text not null default 'studyverse-' || replace(gen_random_uuid()::text, '-', ''),
  weekly_goal_minutes int  not null default 600 check (weekly_goal_minutes between 30 and 10000),
  created_at          timestamptz not null default now()
);

create table if not exists group_members (
  group_id     uuid not null references study_groups (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  role         text not null default 'member' check (role in ('owner', 'member')),
  status       text check (char_length(status) <= 80),   -- "what I'm working on"
  last_seen    timestamptz,
  joined_at    timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists resources (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  subject_id    uuid references subjects (id) on delete set null,
  group_id      uuid references study_groups (id) on delete cascade,
  kind          text not null default 'link' check (kind in ('video', 'playlist', 'link', 'pdf')),
  url           text not null check (url ~* '^https?://'),
  title         text not null check (char_length(title) between 1 and 200),
  author        text,
  thumbnail_url text,
  watched       boolean not null default false,
  created_at    timestamptz not null default now()
);

alter table tasks          add column if not exists subject_id  uuid references subjects (id) on delete set null;
alter table tasks          add column if not exists resource_id uuid references resources (id) on delete set null;
alter table notes          add column if not exists subject_id  uuid references subjects (id) on delete set null;
alter table planner_blocks add column if not exists subject_id  uuid references subjects (id) on delete set null;
alter table planner_blocks add column if not exists resource_id uuid references resources (id) on delete set null;

create table if not exists attendance (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  subject_id uuid not null references subjects (id) on delete cascade,
  class_date date not null default current_date,
  status     text not null check (status in ('present', 'absent', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists exams (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  subject_id uuid references subjects (id) on delete set null,
  title      text not null check (char_length(title) between 1 and 120),
  exam_at    timestamptz not null,
  location   text check (char_length(location) <= 120),
  created_at timestamptz not null default now()
);

create table if not exists flashcards (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  subject_id uuid references subjects (id) on delete set null,
  note_id    uuid references notes (id) on delete set null,
  front      text not null check (char_length(front) between 1 and 500),
  back       text not null check (char_length(back) between 1 and 2000),
  box        int  not null default 1 check (box between 1 and 6),
  due_at     timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists push_subscriptions (
  endpoint   text primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

create table if not exists ai_requests (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null,
  created_at timestamptz not null default now()
);

create table if not exists group_messages (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references study_groups (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        text not null default 'text' check (kind in ('text', 'quiz', 'resource')),
  body        text not null check (char_length(body) between 1 and 2000),
  answer      text check (char_length(answer) <= 1000),
  resource_id uuid references resources (id) on delete set null,
  created_at  timestamptz not null default now()
);

-- One shared focus timer per group. ends_at set = running; paused_seconds set = paused.
create table if not exists group_sessions (
  group_id       uuid primary key references study_groups (id) on delete cascade,
  phase          text not null default 'work' check (phase in ('work', 'break')),
  minutes        int  not null default 25 check (minutes between 1 and 180),
  ends_at        timestamptz,
  paused_seconds int,
  started_by     uuid references auth.users (id) on delete set null,
  updated_at     timestamptz not null default now()
);

create index if not exists subjects_user_idx        on subjects (user_id);
create index if not exists resources_user_idx       on resources (user_id);
create index if not exists resources_group_idx      on resources (group_id);
create index if not exists attendance_subject_idx   on attendance (subject_id);
create index if not exists exams_user_idx           on exams (user_id, exam_at);
create index if not exists flashcards_due_idx       on flashcards (user_id, due_at);
create index if not exists ai_requests_user_idx     on ai_requests (user_id, created_at);
create index if not exists group_members_user_idx   on group_members (user_id);
create index if not exists group_messages_group_idx on group_messages (group_id, created_at desc);

-- ───────────────────────── Functions ─────────────────────────

-- Membership check used by the policies below. security definer avoids policies recursing into group_members.
create or replace function public.is_group_member(gid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from group_members where group_id = gid and user_id = auth.uid())
$$;

-- Creates a group with the caller as owner, plus its shared timer row.
create or replace function public.create_group(p_name text, p_description text, p_display_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare gid uuid;
begin
  if auth.uid() is null then raise exception 'Log in first'; end if;
  insert into study_groups (name, description, owner_id)
    values (trim(p_name), nullif(trim(p_description), ''), auth.uid()) returning id into gid;
  insert into group_members (group_id, user_id, display_name, role) values (gid, auth.uid(), left(trim(p_display_name), 40), 'owner');
  insert into group_sessions (group_id) values (gid);
  return gid;
end $$;

-- Joins by invite code. Groups cap at 30 members.
create or replace function public.join_group(p_code text, p_display_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare gid uuid;
begin
  if auth.uid() is null then raise exception 'Log in first'; end if;
  select id into gid from study_groups where invite_code = upper(trim(p_code));
  if gid is null then raise exception 'No group has that invite code'; end if;
  if not exists (select 1 from group_members where group_id = gid and user_id = auth.uid())
     and (select count(*) from group_members where group_id = gid) >= 30 then
    raise exception 'That group is full';
  end if;
  insert into group_members (group_id, user_id, display_name) values (gid, auth.uid(), left(trim(p_display_name), 40))
    on conflict (group_id, user_id) do nothing;
  return gid;
end $$;

-- Focus minutes this week per member, readable only by members of that group.
create or replace function public.group_focus_week(gid uuid)
returns table (user_id uuid, display_name text, minutes bigint)
language sql stable security definer set search_path = public as $$
  select m.user_id, m.display_name, coalesce(sum(s.minutes), 0)::bigint
  from group_members m
  left join pomodoro_sessions s
    on s.user_id = m.user_id and s.kind = 'work' and s.started_at >= date_trunc('week', now())
  where m.group_id = gid and public.is_group_member(gid)
  group by m.user_id, m.display_name
  order by 3 desc
$$;

-- Public, read-only view of one shared subject's personal resources. Only works with the exact share token.
create or replace function public.shared_subject(p_token text)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'name', s.name,
    'color', s.color,
    'resources', coalesce((
      select json_agg(json_build_object('title', r.title, 'url', r.url, 'kind', r.kind, 'author', r.author, 'thumbnail_url', r.thumbnail_url) order by r.created_at)
      from resources r where r.subject_id = s.id and r.group_id is null
    ), '[]'::json))
  from subjects s
  where p_token is not null and length(p_token) >= 16 and s.share_token = p_token
$$;

grant execute on function public.shared_subject(text) to anon, authenticated;

-- ───────────────────────── Row-level security ─────────────────────────

alter table subjects           enable row level security;
alter table study_groups       enable row level security;
alter table group_members      enable row level security;
alter table resources          enable row level security;
alter table attendance         enable row level security;
alter table exams              enable row level security;
alter table flashcards         enable row level security;
alter table push_subscriptions enable row level security;
alter table ai_requests        enable row level security;
alter table group_messages     enable row level security;
alter table group_sessions     enable row level security;

drop policy if exists "own subjects" on subjects;
create policy "own subjects" on subjects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own attendance" on attendance;
create policy "own attendance" on attendance for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own exams" on exams;
create policy "own exams" on exams for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own flashcards" on flashcards;
create policy "own flashcards" on flashcards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own push subscriptions" on push_subscriptions;
create policy "own push subscriptions" on push_subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- AI usage log: readable and insertable by its owner, never editable, so the daily cap can't be reset.
drop policy if exists "read own ai requests" on ai_requests;
create policy "read own ai requests" on ai_requests for select using (auth.uid() = user_id);
drop policy if exists "log own ai requests" on ai_requests;
create policy "log own ai requests" on ai_requests for insert with check (auth.uid() = user_id);

-- Resources: personal ones are private; group ones are visible to that group's members.
drop policy if exists "read resources" on resources;
create policy "read resources" on resources for select
  using (auth.uid() = user_id or (group_id is not null and public.is_group_member(group_id)));
drop policy if exists "add resources" on resources;
create policy "add resources" on resources for insert
  with check (auth.uid() = user_id and (group_id is null or public.is_group_member(group_id)));
drop policy if exists "edit own resources" on resources;
create policy "edit own resources" on resources for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "delete own resources" on resources;
create policy "delete own resources" on resources for delete using (auth.uid() = user_id);

-- Groups: members can see; only the owner can edit or delete. Creation goes through create_group().
drop policy if exists "members read group" on study_groups;
create policy "members read group" on study_groups for select using (public.is_group_member(id));
drop policy if exists "owner edits group" on study_groups;
create policy "owner edits group" on study_groups for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "owner deletes group" on study_groups;
create policy "owner deletes group" on study_groups for delete using (auth.uid() = owner_id);

-- Members: see your groups' members; edit only your own row; leave, or be removed by the owner. Joining goes through join_group().
drop policy if exists "members read members" on group_members;
create policy "members read members" on group_members for select using (public.is_group_member(group_id));
drop policy if exists "edit own membership" on group_members;
create policy "edit own membership" on group_members for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "leave or remove" on group_members;
create policy "leave or remove" on group_members for delete
  using (auth.uid() = user_id or exists (select 1 from study_groups g where g.id = group_id and g.owner_id = auth.uid()));
-- Members may change their name, status and heartbeat, never their role.
revoke update on group_members from authenticated, anon;
grant update (display_name, status, last_seen) on group_members to authenticated;

drop policy if exists "members read messages" on group_messages;
create policy "members read messages" on group_messages for select using (public.is_group_member(group_id));
drop policy if exists "members send messages" on group_messages;
create policy "members send messages" on group_messages for insert
  with check (auth.uid() = user_id and public.is_group_member(group_id));
drop policy if exists "delete own messages" on group_messages;
create policy "delete own messages" on group_messages for delete using (auth.uid() = user_id);

drop policy if exists "members read timer" on group_sessions;
create policy "members read timer" on group_sessions for select using (public.is_group_member(group_id));
drop policy if exists "members run timer" on group_sessions;
create policy "members run timer" on group_sessions for update using (public.is_group_member(group_id)) with check (public.is_group_member(group_id));

-- ───────────────────────── Realtime ─────────────────────────
-- Live chat, presence and the shared timer. Realtime only delivers rows the subscriber may read (RLS above).
do $$
declare t text;
begin
  foreach t in array array['group_messages', 'group_members', 'group_sessions'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

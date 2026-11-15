-- StudyVerse 0004: a live call link for each group, focus nudges and a scheduled (weekly) group session.
-- Safe to run more than once.

alter table group_sessions add column if not exists call_url  text;        -- the call happening now (Google Meet, Zoom, Teams, Jitsi, Discord)
alter table group_sessions add column if not exists nudged_at timestamptz; -- last "focus starting" push, for rate limiting
alter table study_groups   add column if not exists next_session_at timestamptz;
alter table study_groups   add column if not exists session_weekly  boolean not null default false;

-- Only real meeting links can be shared as the group call, so nobody can plant a javascript: or phishing link.
alter table group_sessions drop constraint if exists group_sessions_call_url_check;
alter table group_sessions add constraint group_sessions_call_url_check check (
  call_url is null
  or (char_length(call_url) <= 300
      and call_url ~* '^https://(meet\.google\.com|meet\.jit\.si|([a-z0-9-]+\.)?zoom\.us|teams\.microsoft\.com|teams\.live\.com|discord\.gg|discord\.com)/\S*$')
);

-- Members run the timer and the call link. Only the server writes nudged_at, so nobody can reset it to spam notifications.
revoke update on group_sessions from authenticated, anon;
grant update (phase, minutes, ends_at, paused_seconds, started_by, updated_at, call_url) on group_sessions to authenticated;

-- StudyVerse schema + row-level security. Idempotent: safe to re-run on the existing project.
-- Run in Supabase Dashboard -> SQL Editor.

create table if not exists tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  description text,
  due_date    timestamptz,
  completed   boolean not null default false,
  created_at  timestamptz not null default now()
);
alter table tasks add column if not exists priority text
  check (priority in ('low', 'medium', 'high')) default 'medium';

create table if not exists notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null,
  content    text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists quotes (
  id       bigint generated always as identity primary key,
  text     text not null,
  author   text,
  category text not null default 'study'
);

create index if not exists tasks_user_id_idx on tasks (user_id);
create index if not exists notes_user_id_idx on notes (user_id);

alter table tasks  enable row level security;
alter table notes  enable row level security;
alter table quotes enable row level security;

drop policy if exists "own tasks" on tasks;
create policy "own tasks" on tasks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own notes" on notes;
create policy "own notes" on notes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "quotes public read" on quotes;
create policy "quotes public read" on quotes for select using (true);

-- Seed quotes only if the table is empty.
insert into quotes (text, author)
select * from (values
  ('The secret of getting ahead is getting started.', 'Mark Twain'),
  ('It always seems impossible until it''s done.', 'Nelson Mandela'),
  ('Don''t watch the clock; do what it does. Keep going.', 'Sam Levenson'),
  ('The expert in anything was once a beginner.', 'Helen Hayes'),
  ('Success is the sum of small efforts, repeated day in and day out.', 'Robert Collier'),
  ('Education is the most powerful weapon which you can use to change the world.', 'Nelson Mandela'),
  ('The beautiful thing about learning is that no one can take it away from you.', 'B.B. King'),
  ('Push yourself, because no one else is going to do it for you.', 'Unknown'),
  ('There are no shortcuts to any place worth going.', 'Beverly Sills'),
  ('Live as if you were to die tomorrow. Learn as if you were to live forever.', 'Mahatma Gandhi'),
  ('An investment in knowledge pays the best interest.', 'Benjamin Franklin'),
  ('The roots of education are bitter, but the fruit is sweet.', 'Aristotle'),
  ('I am still learning.', 'Michelangelo'),
  ('Procrastination is the thief of time.', 'Edward Young'),
  ('Believe you can and you''re halfway there.', 'Theodore Roosevelt'),
  ('Well done is better than well said.', 'Benjamin Franklin'),
  ('It does not matter how slowly you go as long as you do not stop.', 'Confucius'),
  ('Genius is one percent inspiration and ninety-nine percent perspiration.', 'Thomas Edison'),
  ('The only way to learn mathematics is to do mathematics.', 'Paul Halmos'),
  ('You don''t have to be great to start, but you have to start to be great.', 'Zig Ziglar'),
  ('Little by little, one travels far.', 'Spanish proverb'),
  ('Discipline is choosing between what you want now and what you want most.', 'Unknown'),
  ('The mind is not a vessel to be filled, but a fire to be kindled.', 'Plutarch'),
  ('What we learn with pleasure we never forget.', 'Alfred Mercier'),
  ('Strive for progress, not perfection.', 'Unknown'),
  ('A little progress each day adds up to big results.', 'Unknown'),
  ('Focus on being productive instead of busy.', 'Tim Ferriss'),
  ('Either you run the day or the day runs you.', 'Jim Rohn'),
  ('The best way to predict your future is to create it.', 'Abraham Lincoln'),
  ('Learning never exhausts the mind.', 'Leonardo da Vinci')
) as seed(text, author)
where not exists (select 1 from quotes);

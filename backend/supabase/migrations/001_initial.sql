-- ============================================================
-- ilm.io — Supabase initial schema
-- Run via: supabase db push  OR paste into SQL Editor in Supabase dashboard
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";   -- for fuzzy search on content

-- ── uploads ──────────────────────────────────────────────────────────────
create table if not exists uploads (
  id            uuid primary key default uuid_generate_v4(),
  filename      text not null,
  file_type     text not null,             -- pdf | image | audio | docx
  text_content  text not null default '',
  word_count    integer not null default 0,
  storage_path  text not null,
  storage_url   text,
  created_at    timestamptz not null default now()
);

-- ── generations ───────────────────────────────────────────────────────────
create table if not exists generations (
  id            uuid primary key default uuid_generate_v4(),
  file_id       uuid references uploads(id) on delete cascade,
  kind          text not null,             -- slides | audiobook | worksheet | ...
  condition     text not null default 'general',
  storage_path  text,
  created_at    timestamptz not null default now()
);

-- ── students ──────────────────────────────────────────────────────────────
create table if not exists students (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  emoji            text not null default '🌱',
  condition        text not null default 'general',
  learning_style   text not null default 'mixed',
  streak_days      integer not null default 0,
  weekly_progress  integer not null default 0,   -- 0-100
  insights         jsonb not null default '[]',
  attention_trend  integer[] not null default '{}',
  last_active      timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

-- Seed demo students
insert into students (id, name, emoji, condition, learning_style, streak_days, weekly_progress, insights, attention_trend)
values
  ('11111111-0000-0000-0000-000000000001', 'Alex Chen',    '🦋', 'ADHD · Visual',     'visual',    7,  70, '[{"label":"Best focus time","value":"Morning","trend":"stable"},{"label":"Attention span","value":"18 min","trend":"up"}]', '{82,78,90,65,88,76,85}'),
  ('11111111-0000-0000-0000-000000000002', 'Sam Rivera',   '🌻', 'Dyslexia',          'auditory',  3,  50, '[{"label":"Preferred format","value":"Audio","trend":"stable"},{"label":"Reading pace","value":"Improving","trend":"up"}]', '{60,55,70,65,72,68,74}'),
  ('11111111-0000-0000-0000-000000000003', 'Jordan Park',  '🦉', 'Autism Spectrum',   'structured',12,  85, '[{"label":"Routine adherence","value":"High","trend":"stable"},{"label":"Completion rate","value":"92%","trend":"up"}]', '{90,88,92,87,95,91,93}'),
  ('11111111-0000-0000-0000-000000000004', 'Maya Osei',    '🌿', 'ADHD · Dyscalculia','kinesthetic',5,  60, '[{"label":"Math engagement","value":"Improving","trend":"up"},{"label":"Focus sessions","value":"15 min","trend":"stable"}]', '{55,60,58,65,62,70,68}')
on conflict (id) do nothing;

-- ── engagement_events ─────────────────────────────────────────────────────
create table if not exists engagement_events (
  id               uuid primary key default uuid_generate_v4(),
  student_id       uuid references students(id) on delete cascade,
  session_id       text not null,
  event_type       text not null,          -- slide_view | quiz_answer | chatbot_open | download
  topic            text,
  week_number      integer,
  difficulty       numeric(3,1),           -- 1.0-5.0
  engagement_score numeric(3,1),           -- 0.0-1.0
  metadata         jsonb not null default '{}',
  created_at       timestamptz not null default now()
);

create index if not exists idx_events_student on engagement_events(student_id);
create index if not exists idx_events_week    on engagement_events(week_number);
create index if not exists idx_events_topic   on engagement_events(topic);

-- ── chat_sessions ─────────────────────────────────────────────────────────
create table if not exists chat_sessions (
  id          uuid primary key default uuid_generate_v4(),
  session_id  text not null,
  role        text not null,              -- user | assistant
  content     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_chat_session on chat_sessions(session_id);

-- ── weekly_reports ────────────────────────────────────────────────────────
create table if not exists weekly_reports (
  id               uuid primary key default uuid_generate_v4(),
  week_label       text not null,
  summary          text not null default '',
  highlights       jsonb not null default '[]',
  recommendations  jsonb not null default '[]',
  download_url     text,
  created_at       timestamptz not null default now()
);

-- ── Storage bucket (run separately in Supabase dashboard or CLI) ──────────
-- supabase storage create ilmio-uploads --public
-- supabase storage policy create ilmio-uploads --operation SELECT --role anon

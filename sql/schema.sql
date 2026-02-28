create table if not exists app_config (
  id int primary key default 1,
  gmail_refresh_token text,
  gmail_label_map jsonb,
  updated_at timestamptz not null default now()
);

insert into app_config (id)
values (1)
on conflict (id) do nothing;

create table if not exists triage_messages (
  message_id text primary key,
  thread_id text,
  internal_date timestamptz,
  from_email text,
  subject text,
  snippet text,
  category text,
  priority text,
  mark_read boolean,
  summary text,
  reason text,
  applied_labels text[],
  processed_at timestamptz not null default now()
);

create index if not exists triage_messages_processed_at_idx on triage_messages (processed_at desc);
create index if not exists triage_messages_category_idx on triage_messages (category);

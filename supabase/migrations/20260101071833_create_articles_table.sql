create table articles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text,
  slug text unique,
  original_content text,
  html_content text,
  markdown_content text,
  source_url text,
  status text default 'original',
  generated_content text
);

alter table articles enable row level security;

create policy "Public Read" on articles for select using (true);

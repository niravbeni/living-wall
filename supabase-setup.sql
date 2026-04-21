-- Living Wall - Supabase Database Setup
-- Run this SQL in the Supabase SQL Editor (Dashboard > SQL Editor)

-- 1. Create carousel_items table
create table if not exists carousel_items (
  id uuid default gen_random_uuid() primary key,
  type text not null check (type in ('image', 'video', 'web', 'divider')),
  title text default '',
  media_url text not null,
  thumbnail_url text default '',
  duration_seconds integer default 5,
  video_loop boolean default false,
  video_speed numeric default 1.5,
  visible_in_carousel boolean default true,
  divider_enabled boolean default true,
  divider_title text default '',
  divider_subtitle text default '',
  divider_body text default '',
  divider_background text default '#000000',
  divider_duration_seconds integer default 5,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- 2. Create carousel_settings table (single-row config)
create table if not exists carousel_settings (
  id integer primary key default 1 check (id = 1),
  auto_loop boolean default true,
  transition_type text default 'crossfade' check (transition_type in ('crossfade', 'slide', 'zoomFade', 'cardStack')),
  transition_duration_ms integer default 800,
  default_item_duration_seconds integer default 5,
  show_progress_bar boolean default true
);

-- 3. Insert default settings row
insert into carousel_settings (id) values (1) on conflict (id) do nothing;

-- 4. Enable Row Level Security
alter table carousel_items enable row level security;
alter table carousel_settings enable row level security;

-- 5. RLS Policies - allow public read/write (no auth required)
create policy "Allow public read on carousel_items"
  on carousel_items for select
  using (true);

create policy "Allow public insert on carousel_items"
  on carousel_items for insert
  with check (true);

create policy "Allow public update on carousel_items"
  on carousel_items for update
  using (true);

create policy "Allow public delete on carousel_items"
  on carousel_items for delete
  using (true);

create policy "Allow public read on carousel_settings"
  on carousel_settings for select
  using (true);

create policy "Allow public update on carousel_settings"
  on carousel_settings for update
  using (true);

-- 6. Enable Realtime for both tables
alter publication supabase_realtime add table carousel_items;
alter publication supabase_realtime add table carousel_settings;

-- 7. Create storage bucket for media
-- NOTE: You also need to create a storage bucket named "media" in
-- Supabase Dashboard > Storage, with public access enabled.
-- Then add these storage policies in Dashboard > Storage > Policies:
--   - Allow public uploads (INSERT): true
--   - Allow public reads (SELECT): true
--   - Allow public deletes (DELETE): true

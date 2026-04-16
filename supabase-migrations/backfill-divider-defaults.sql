-- Backfill existing content rows with divider intro defaults.
-- Safe to re-run. Only touches image/video/web rows.

-- 1. Ensure columns exist (idempotent)
alter table carousel_items add column if not exists divider_enabled boolean default true;
alter table carousel_items add column if not exists divider_title text default '';
alter table carousel_items add column if not exists divider_subtitle text default '';
alter table carousel_items add column if not exists divider_body text default '';
alter table carousel_items add column if not exists divider_background text default '#000000';
alter table carousel_items add column if not exists divider_duration_seconds integer default 3;

-- 2. Enable intro on all content rows and fill placeholder text
update carousel_items
set
  divider_enabled = true,
  divider_title = coalesce(nullif(trim(divider_title), ''), title),
  divider_subtitle = case when coalesce(trim(divider_subtitle), '') = '' then 'Lorem ipsum dolor sit amet' else divider_subtitle end,
  divider_body = case when coalesce(trim(divider_body), '') = '' then 'Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' else divider_body end,
  divider_background = coalesce(nullif(trim(divider_background), ''), '#000000'),
  divider_duration_seconds = coalesce(divider_duration_seconds, 3)
where type in ('image', 'video', 'web');

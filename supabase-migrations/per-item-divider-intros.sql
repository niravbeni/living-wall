-- Per-item intro slides (divider copy + background on each carousel row).
-- Run after prior migrations. Safe to re-run (IF NOT EXISTS).

alter table carousel_items add column if not exists divider_enabled boolean default false;
alter table carousel_items add column if not exists divider_title text default '';
alter table carousel_items add column if not exists divider_subtitle text default '';
alter table carousel_items add column if not exists divider_body text default '';
alter table carousel_items add column if not exists divider_background text default '#000000';
alter table carousel_items add column if not exists divider_duration_seconds integer default 5;

update carousel_items
set
  divider_enabled = coalesce(divider_enabled, false),
  divider_title = coalesce(divider_title, ''),
  divider_subtitle = coalesce(divider_subtitle, ''),
  divider_body = coalesce(divider_body, ''),
  divider_background = coalesce(nullif(trim(divider_background), ''), '#000000'),
  divider_duration_seconds = coalesce(divider_duration_seconds, 5)
where true;

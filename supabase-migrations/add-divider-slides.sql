-- Divider slides + global copy/duration. Run once in Supabase SQL Editor.

alter table carousel_items drop constraint if exists carousel_items_type_check;
alter table carousel_items add constraint carousel_items_type_check
  check (type in ('image', 'video', 'web', 'divider'));

alter table carousel_settings add column if not exists divider_title text default '';
alter table carousel_settings add column if not exists divider_subtitle text default '';
alter table carousel_settings add column if not exists divider_body text default '';
alter table carousel_settings add column if not exists divider_duration_seconds integer default 5;

update carousel_settings set
  divider_title = coalesce(divider_title, ''),
  divider_subtitle = coalesce(divider_subtitle, ''),
  divider_body = coalesce(divider_body, ''),
  divider_duration_seconds = coalesce(divider_duration_seconds, 5)
where id = 1;

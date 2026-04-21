-- Per-item caption overlay fields. Safe to re-run.
-- caption_enabled: toggle the bottom-left caption card during playback.
-- caption_title / caption_subtitle: optional, override the text shown in the
-- caption card. When blank, playback falls back to divider_title / divider_subtitle.
alter table carousel_items add column if not exists caption_enabled boolean default true;
alter table carousel_items add column if not exists caption_title text default '';
alter table carousel_items add column if not exists caption_subtitle text default '';

update carousel_items
set
  caption_enabled = coalesce(caption_enabled, true),
  caption_title = coalesce(caption_title, ''),
  caption_subtitle = coalesce(caption_subtitle, '');

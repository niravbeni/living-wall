-- Add per-video playback speed column. Default 2x. Safe to re-run.
alter table carousel_items add column if not exists video_speed numeric default 2;

update carousel_items
set video_speed = 2
where video_speed is null;

-- Add per-video playback speed column. Default 1.5x. Safe to re-run.
alter table carousel_items add column if not exists video_speed numeric default 1.5;

update carousel_items
set video_speed = 1.5
where video_speed is null;

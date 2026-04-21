-- Per-video playback speed. Range 0.25x–2x in 0.25 increments. Default 1.5x.
-- Safe to re-run. This will reset every item's video_speed to 1.5.
alter table carousel_items add column if not exists video_speed numeric default 1.5;

update carousel_items
set video_speed = 1.5;

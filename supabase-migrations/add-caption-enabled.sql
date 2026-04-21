-- Per-item caption overlay toggle. Default true. Safe to re-run.
alter table carousel_items add column if not exists caption_enabled boolean default true;

update carousel_items
set caption_enabled = true
where caption_enabled is null;

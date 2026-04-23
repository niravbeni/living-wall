-- Per-item caption overlay theme. Safe to re-run.
-- caption_theme: "light" keeps the default frosted-glass look; "dark"
-- switches the card to a near-black translucent style that reads well
-- over bright / white content.
alter table carousel_items
  add column if not exists caption_theme text default 'light';

update carousel_items
set caption_theme = coalesce(caption_theme, 'light');

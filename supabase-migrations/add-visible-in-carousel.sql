-- Run once in Supabase SQL Editor if your project was created before visible_in_carousel existed

alter table carousel_items
  add column if not exists visible_in_carousel boolean default true;

update carousel_items
  set visible_in_carousel = true
  where visible_in_carousel is null;

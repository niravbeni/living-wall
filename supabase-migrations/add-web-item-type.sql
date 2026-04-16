-- Allow carousel_items.type = 'web' (iframe URLs). Run once in Supabase SQL Editor.

alter table carousel_items drop constraint if exists carousel_items_type_check;

alter table carousel_items add constraint carousel_items_type_check
  check (type in ('image', 'video', 'web'));

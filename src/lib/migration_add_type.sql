-- Add 'type' column to pets table to support filtering (dog, cat, etc.)
alter table public.pets add column type text default 'dog';

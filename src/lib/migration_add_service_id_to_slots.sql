-- Add service_id to time_slots table
alter table public.time_slots
add column service_id uuid references public.services(id) on delete cascade;

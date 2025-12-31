-- Add pet_id to bookings table
alter table public.bookings
add column pet_id bigint references public.pets(id) on delete set null;

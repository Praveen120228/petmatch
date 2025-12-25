-- Add ip_address column to profiles table
alter table public.profiles 
add column if not exists ip_address text;

comment on column public.profiles.ip_address is 'User IP address for security and location detection';

-- Add views_count column to posts table
alter table public.posts 
add column if not exists views_count int default 0;

-- Function to atomically increment view count
create or replace function public.increment_post_view(post_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.posts
  set views_count = views_count + 1
  where id = post_id;
end;
$$;

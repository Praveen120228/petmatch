-- Function to handle like count changes
create or replace function public.handle_new_like()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.posts
  set likes_count = likes_count + 1
  where id = new.post_id;
  return new;
end;
$$;

create or replace function public.handle_unlike()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.posts
  set likes_count = likes_count - 1
  where id = old.post_id;
  return old;
end;
$$;

-- Triggers for post_likes table
drop trigger if exists on_like_created on public.post_likes;
create trigger on_like_created
  after insert on public.post_likes
  for each row execute procedure public.handle_new_like();

drop trigger if exists on_like_deleted on public.post_likes;
create trigger on_like_deleted
  after delete on public.post_likes
  for each row execute procedure public.handle_unlike();

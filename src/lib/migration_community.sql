-- Create Posts Table
create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  image_url text not null,
  caption text,
  tags text[] default '{}',
  likes_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add tags column if it doesn't exist (Migration support)
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'posts' and column_name = 'tags') then
        alter table public.posts add column tags text[] default '{}';
    end if;
end $$;

-- RLS for Posts
alter table public.posts enable row level security;
drop policy if exists "Posts are viewable by everyone." on public.posts;
create policy "Posts are viewable by everyone." on public.posts for select using (true);

drop policy if exists "Users can create posts." on public.posts;
create policy "Users can create posts." on public.posts for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete own posts." on public.posts;
create policy "Users can delete own posts." on public.posts for delete using (auth.uid() = user_id);


-- Create Post Likes Table
create table if not exists public.post_likes (
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (post_id, user_id)
);

-- RLS for Likes
alter table public.post_likes enable row level security;
drop policy if exists "Likes are viewable by everyone." on public.post_likes;
create policy "Likes are viewable by everyone." on public.post_likes for select using (true);

drop policy if exists "Users can like posts." on public.post_likes;
create policy "Users can like posts." on public.post_likes for insert with check (auth.uid() = user_id);

drop policy if exists "Users can unlike posts." on public.post_likes;
create policy "Users can unlike posts." on public.post_likes for delete using (auth.uid() = user_id);


-- Storage Bucket Configuration
insert into storage.buckets (id, name, public)
values ('posts', 'posts', true)
on conflict (id) do nothing;

-- Storage Policies
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'posts' );

create policy "Authenticated Upload"
  on storage.objects for insert
  with check ( bucket_id = 'posts' and auth.role() = 'authenticated' );

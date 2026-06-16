-- ============================================================================
-- Steal My Flow — initial schema
-- Run in the Supabase SQL editor (or `supabase db push`).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles : one row per authenticated user
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null unique references auth.users (id) on delete cascade,
  full_name      text,
  avatar_url     text,
  bio            text,
  specialization text,
  role           text not null default 'instructor' check (role in ('instructor','admin')),
  verified       boolean not null default false,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- certifications : credentials uploaded for verification
-- ---------------------------------------------------------------------------
create table if not exists public.certifications (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  title       text,
  file_url    text not null,
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_at timestamptz,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- flows : a class flow / lesson plan
-- ---------------------------------------------------------------------------
create table if not exists public.flows (
  id               uuid primary key default gen_random_uuid(),
  creator_id       uuid not null references public.profiles (id) on delete cascade,
  title            text not null,
  description      text,
  category         text not null,
  difficulty       text not null check (difficulty in ('beginner','intermediate','advanced','all-levels')),
  duration_minutes integer not null check (duration_minutes > 0),
  cover_image      text,
  youtube_url      text,
  visibility       text not null default 'public' check (visibility in ('public','private')),
  created_at       timestamptz not null default now()
);
create index if not exists flows_creator_idx on public.flows (creator_id);
create index if not exists flows_created_idx on public.flows (created_at desc);

-- ---------------------------------------------------------------------------
-- flow_steps : ordered steps that make up a flow
-- ---------------------------------------------------------------------------
create table if not exists public.flow_steps (
  id               uuid primary key default gen_random_uuid(),
  flow_id          uuid not null references public.flows (id) on delete cascade,
  order_index      integer not null,
  title            text not null,
  content          text,
  duration_minutes integer
);
create index if not exists flow_steps_flow_idx on public.flow_steps (flow_id, order_index);

-- ---------------------------------------------------------------------------
-- likes / steals : engagement (composite PKs prevent duplicates)
-- ---------------------------------------------------------------------------
create table if not exists public.likes (
  user_id    uuid not null references auth.users (id) on delete cascade,
  flow_id    uuid not null references public.flows (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, flow_id)
);

create table if not exists public.steals (
  user_id    uuid not null references auth.users (id) on delete cascade,
  flow_id    uuid not null references public.flows (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, flow_id)
);

-- ---------------------------------------------------------------------------
-- follows : follower (user) -> following (instructor profile)
-- ---------------------------------------------------------------------------
create table if not exists public.follows (
  follower_id  uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id)
);

-- ---------------------------------------------------------------------------
-- ai_generations : history of AI-generated flows
-- ---------------------------------------------------------------------------
create table if not exists public.ai_generations (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  prompt            text not null,
  params            jsonb,
  generated_content jsonb not null,
  saved_flow_id     uuid references public.flows (id) on delete set null,
  created_at        timestamptz not null default now()
);
create index if not exists ai_generations_user_idx on public.ai_generations (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- flow_stats : aggregated like / steal counts (read-only view)
-- ---------------------------------------------------------------------------
create or replace view public.flow_stats as
select
  f.id as flow_id,
  (select count(*) from public.likes  l where l.flow_id = f.id) as like_count,
  (select count(*) from public.steals s where s.flow_id = f.id) as steal_count
from public.flows f;

-- ---------------------------------------------------------------------------
-- helper : is the current user an admin?
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- trigger : auto-create a profile when a user signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles       enable row level security;
alter table public.certifications enable row level security;
alter table public.flows          enable row level security;
alter table public.flow_steps     enable row level security;
alter table public.likes          enable row level security;
alter table public.steals         enable row level security;
alter table public.follows        enable row level security;
alter table public.ai_generations enable row level security;

-- profiles --------------------------------------------------------------
create policy "profiles are public" on public.profiles
  for select using (true);
create policy "users insert own profile" on public.profiles
  for insert with check (auth.uid() = user_id);
create policy "users update own profile" on public.profiles
  for update using (auth.uid() = user_id or public.is_admin());

-- certifications --------------------------------------------------------
create policy "own or admin can read certs" on public.certifications
  for select using (
    public.is_admin()
    or profile_id in (select id from public.profiles where user_id = auth.uid())
  );
create policy "own can insert certs" on public.certifications
  for insert with check (
    profile_id in (select id from public.profiles where user_id = auth.uid())
  );
create policy "admin can review certs" on public.certifications
  for update using (public.is_admin());

-- flows -----------------------------------------------------------------
create policy "public flows are readable" on public.flows
  for select using (
    visibility = 'public'
    or public.is_admin()
    or creator_id in (select id from public.profiles where user_id = auth.uid())
  );
create policy "own can insert flows" on public.flows
  for insert with check (
    creator_id in (select id from public.profiles where user_id = auth.uid())
  );
create policy "own or admin can update flows" on public.flows
  for update using (
    public.is_admin()
    or creator_id in (select id from public.profiles where user_id = auth.uid())
  );
create policy "own or admin can delete flows" on public.flows
  for delete using (
    public.is_admin()
    or creator_id in (select id from public.profiles where user_id = auth.uid())
  );

-- flow_steps : inherit visibility / ownership from parent flow ----------
create policy "steps readable when flow readable" on public.flow_steps
  for select using (
    exists (
      select 1 from public.flows f
      where f.id = flow_id
        and (
          f.visibility = 'public'
          or public.is_admin()
          or f.creator_id in (select id from public.profiles where user_id = auth.uid())
        )
    )
  );
create policy "owner manages steps" on public.flow_steps
  for all using (
    exists (
      select 1 from public.flows f
      where f.id = flow_id
        and f.creator_id in (select id from public.profiles where user_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.flows f
      where f.id = flow_id
        and f.creator_id in (select id from public.profiles where user_id = auth.uid())
    )
  );

-- likes -----------------------------------------------------------------
create policy "likes readable" on public.likes for select using (true);
create policy "users manage own likes" on public.likes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- steals ----------------------------------------------------------------
create policy "steals readable" on public.steals for select using (true);
create policy "users manage own steals" on public.steals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- follows ---------------------------------------------------------------
create policy "follows readable" on public.follows for select using (true);
create policy "users manage own follows" on public.follows
  for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

-- ai_generations : strictly private -------------------------------------
create policy "users manage own generations" on public.ai_generations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- Storage buckets + policies
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('avatars','avatars',true), ('covers','covers',true), ('certifications','certifications',false)
on conflict (id) do nothing;

-- public read for avatars & covers
create policy "public read avatars" on storage.objects
  for select using (bucket_id in ('avatars','covers'));
-- authenticated users can upload to avatars/covers
create policy "auth upload media" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('avatars','covers'));
-- certifications: owner uploads, owner/admin reads (path prefixed by user id)
create policy "auth upload certs" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'certifications' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owner or admin read certs" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'certifications'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

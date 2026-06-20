-- ============================================================================
-- Migration 0003 — idempotent setup / repair.
-- Safe to run multiple times. Run this in the Supabase SQL editor if uploads
-- or flow publishing fail: it guarantees the storage buckets and every RLS
-- policy exist and are correct, regardless of current state.
-- ============================================================================

-- ---- Storage buckets -------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars','avatars',true), ('covers','covers',true), ('certifications','certifications',false)
on conflict (id) do update set public = excluded.public;

-- ---- helper ----------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin');
$$;

-- ---- enable RLS everywhere --------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.certifications enable row level security;
alter table public.flows          enable row level security;
alter table public.flow_steps     enable row level security;
alter table public.likes          enable row level security;
alter table public.steals         enable row level security;
alter table public.follows        enable row level security;
alter table public.ai_generations enable row level security;

-- ---- profiles --------------------------------------------------------------
drop policy if exists "profiles are public" on public.profiles;
drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "profiles_select" on public.profiles for select using (true);
drop policy if exists "users insert own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = user_id);
drop policy if exists "users update own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
create policy "profiles_update" on public.profiles for update using (auth.uid() = user_id or public.is_admin());

-- ---- flows -----------------------------------------------------------------
drop policy if exists "public flows are readable" on public.flows;
create policy "flows_select" on public.flows for select using (
  visibility = 'public' or public.is_admin()
  or creator_id in (select id from public.profiles where user_id = auth.uid())
);
drop policy if exists "own can insert flows" on public.flows;
create policy "flows_insert" on public.flows for insert with check (
  creator_id in (select id from public.profiles where user_id = auth.uid())
);
drop policy if exists "own or admin can update flows" on public.flows;
create policy "flows_update" on public.flows for update using (
  public.is_admin() or creator_id in (select id from public.profiles where user_id = auth.uid())
);
drop policy if exists "own or admin can delete flows" on public.flows;
create policy "flows_delete" on public.flows for delete using (
  public.is_admin() or creator_id in (select id from public.profiles where user_id = auth.uid())
);

-- ---- flow_steps ------------------------------------------------------------
drop policy if exists "steps readable when flow readable" on public.flow_steps;
create policy "steps_select" on public.flow_steps for select using (
  exists (select 1 from public.flows f where f.id = flow_id and (
    f.visibility = 'public' or public.is_admin()
    or f.creator_id in (select id from public.profiles where user_id = auth.uid())))
);
drop policy if exists "owner manages steps" on public.flow_steps;
create policy "steps_write" on public.flow_steps for all using (
  exists (select 1 from public.flows f where f.id = flow_id
    and f.creator_id in (select id from public.profiles where user_id = auth.uid()))
) with check (
  exists (select 1 from public.flows f where f.id = flow_id
    and f.creator_id in (select id from public.profiles where user_id = auth.uid()))
);

-- ---- certifications --------------------------------------------------------
drop policy if exists "own or admin can read certs" on public.certifications;
create policy "certs_select" on public.certifications for select using (
  public.is_admin() or profile_id in (select id from public.profiles where user_id = auth.uid())
);
drop policy if exists "own can insert certs" on public.certifications;
create policy "certs_insert" on public.certifications for insert with check (
  profile_id in (select id from public.profiles where user_id = auth.uid())
);
drop policy if exists "admin can review certs" on public.certifications;
create policy "certs_update" on public.certifications for update using (public.is_admin());

-- ---- likes / steals / follows / ai_generations -----------------------------
drop policy if exists "likes readable" on public.likes;
create policy "likes_select" on public.likes for select using (true);
drop policy if exists "users manage own likes" on public.likes;
create policy "likes_write" on public.likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "steals readable" on public.steals;
create policy "steals_select" on public.steals for select using (true);
drop policy if exists "users manage own steals" on public.steals;
create policy "steals_write" on public.steals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "follows readable" on public.follows;
create policy "follows_select" on public.follows for select using (true);
drop policy if exists "users manage own follows" on public.follows;
create policy "follows_write" on public.follows for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

drop policy if exists "users manage own generations" on public.ai_generations;
create policy "ai_write" on public.ai_generations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- storage policies ------------------------------------------------------
drop policy if exists "public read avatars" on storage.objects;
create policy "storage_public_read" on storage.objects for select using (bucket_id in ('avatars','covers'));
drop policy if exists "auth upload media" on storage.objects;
create policy "storage_auth_upload" on storage.objects for insert to authenticated with check (bucket_id in ('avatars','covers'));
drop policy if exists "auth update media" on storage.objects;
create policy "storage_auth_update" on storage.objects for update to authenticated using (bucket_id in ('avatars','covers'));
drop policy if exists "auth upload certs" on storage.objects;
create policy "storage_cert_upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'certifications' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "owner or admin read certs" on storage.objects;
create policy "storage_cert_read" on storage.objects for select to authenticated
  using (bucket_id = 'certifications' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

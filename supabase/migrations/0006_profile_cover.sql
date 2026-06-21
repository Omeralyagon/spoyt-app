-- Profile banner: an image or video shown behind the avatar on the profile page.
alter table public.profiles
  add column if not exists cover_url text;

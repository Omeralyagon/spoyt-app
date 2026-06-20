-- ============================================================================
-- Migration 0005 — music link (Spotify / Apple Music) on a flow.
-- Safe to run multiple times.
-- ============================================================================
alter table public.flows
  add column if not exists music_url text;

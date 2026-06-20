-- ============================================================================
-- Migration 0004 — per-step demo image. Safe to run multiple times.
-- ============================================================================
alter table public.flow_steps
  add column if not exists image_url text;

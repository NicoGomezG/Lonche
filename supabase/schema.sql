-- Lonche Foods — esquema para cachear posts de Instagram
-- Ejecutar completo en Supabase → SQL Editor

-- ============================================================
-- 1. instagram_posts — lectura pública (RLS), solo escribe el
--    backend (Cloudflare Worker) usando la service_role key.
-- ============================================================
create table if not exists public.instagram_posts (
  id           bigint generated always as identity primary key,
  media_id     text not null unique,
  caption      text,
  media_type   text,        -- IMAGE | VIDEO | CAROUSEL_ALBUM
  media_url    text,
  thumbnail_url text,
  permalink    text,
  "timestamp"  timestamptz,
  synced_at    timestamptz not null default now()
);

alter table public.instagram_posts enable row level security;

-- Cualquiera (anon o logueado) puede LEER los posts.
create policy "instagram_posts_public_read"
  on public.instagram_posts
  for select
  to anon, authenticated
  using (true);

-- Sin policies de insert/update/delete: solo la service_role
-- (usada exclusivamente por el Worker) puede escribir, porque
-- service_role bypassa RLS por completo.

-- ============================================================
-- 2. instagram_token — privada, sin ninguna policy pública.
--    Guarda el access token de larga duración para que el
--    Worker pueda renovarlo sin depender de un secret estático.
-- ============================================================
create table if not exists public.instagram_token (
  id           bigint generated always as identity primary key,
  access_token text not null,
  expires_at   timestamptz not null,
  updated_at   timestamptz not null default now()
);

alter table public.instagram_token enable row level security;
-- Intencionalmente sin policies: anon/authenticated no tienen
-- ningún acceso. Solo service_role (Worker) puede leer/escribir.

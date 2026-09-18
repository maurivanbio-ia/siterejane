-- Estrutura do banco para as estatísticas do site (Supabase → SQL Editor → Run).
-- Nenhum IP é guardado: só cidade/país aproximados, seção, origem e tipo de aparelho.

create table if not exists public.visits (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  visitor      text,              -- identificador aleatório do navegador, sem dado pessoal
  event        text not null check (event in ('pageview', 'section', 'cta', 'form')),
  section      text,              -- seção vista (inicio, sobre, psicoterapia...)
  referrer     text,              -- instagram, google, whatsapp, linkedin, direto, outros
  device       text,              -- mobile, tablet, desktop
  city         text,
  region       text,
  country      text,
  country_code text,
  lat          double precision,
  lon          double precision
);

create index if not exists visits_created_at_idx on public.visits (created_at desc);

alter table public.visits enable row level security;

-- Visitantes do site (chave anônima) só podem inserir.
drop policy if exists "site insere visitas" on public.visits;
create policy "site insere visitas" on public.visits
  for insert to anon with check (true);

-- Só usuários logados (a administradora) podem ler.
-- Importante: em Authentication → Providers → Email, desative "Allow new users to sign up"
-- e crie o usuário da administradora em Authentication → Users → Add user.
drop policy if exists "admin le visitas" on public.visits;
create policy "admin le visitas" on public.visits
  for select to authenticated using (true);

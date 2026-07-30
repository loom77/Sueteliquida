-- Archivo central de resultados oficiales. Solo las funciones server-side de
-- Primy acceden con SUPABASE_SERVICE_ROLE_KEY; nunca se expone al navegador.
create table if not exists public.primy_draw_results (
  game_id text not null check (game_id in ('primitiva', 'eurodreams')),
  draw_date date not null,
  winning_numbers smallint[] not null,
  extra smallint,
  complementary smallint,
  prizes jsonb not null default '[]'::jsonb,
  jackpot_next numeric,
  jackpot_formatted text,
  source text not null default 'SELAE oficial',
  source_url text,
  source_hash text,
  official_updated_at timestamptz,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (game_id, draw_date),
  constraint primy_draw_results_six_numbers check (cardinality(winning_numbers) = 6)
);

create index if not exists primy_draw_results_latest_idx
  on public.primy_draw_results (game_id, draw_date desc);

create or replace function public.primy_set_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table public.primy_draw_results enable row level security;

-- No se crean políticas para anon/authenticated. La tabla se consulta a través
-- de /api con service_role, que omite RLS en el servidor.
revoke all on public.primy_draw_results from anon, authenticated;
grant all on public.primy_draw_results to service_role;

drop trigger if exists primy_draw_results_updated_at on public.primy_draw_results;
create trigger primy_draw_results_updated_at
before update on public.primy_draw_results
for each row execute function public.primy_set_updated_at();

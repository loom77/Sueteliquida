-- Primy v15.6: soporte estructural de Lotería Nacional.
alter table public.primy_draw_results
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.primy_draw_results
  drop constraint if exists primy_draw_results_game_id_check;

alter table public.primy_draw_results
  add constraint primy_draw_results_game_id_check
  check (game_id in ('primitiva', 'bonoloto', 'eurodreams', 'euromillones', 'gordoprimitiva', 'loteria-nacional'));

alter table public.primy_draw_results
  drop constraint if exists primy_draw_results_shape_check;

alter table public.primy_draw_results
  add constraint primy_draw_results_shape_check check (
    (game_id = 'euromillones'
      and cardinality(winning_numbers) = 5
      and cardinality(secondary_numbers) = 2
      and extra is null
      and complementary is null)
    or
    (game_id = 'eurodreams'
      and cardinality(winning_numbers) = 6
      and cardinality(secondary_numbers) = 0
      and extra between 1 and 5
      and complementary is null)
    or
    (game_id in ('primitiva', 'bonoloto')
      and cardinality(winning_numbers) = 6
      and cardinality(secondary_numbers) = 0
      and extra between 0 and 9
      and complementary between 1 and 49)
    or
    (game_id = 'gordoprimitiva'
      and cardinality(winning_numbers) = 5
      and cardinality(secondary_numbers) = 0
      and extra between 0 and 9
      and complementary is null)
    or
    (game_id = 'loteria-nacional'
      and cardinality(winning_numbers) = 0
      and cardinality(secondary_numbers) = 0
      and extra is null
      and complementary is null)
  );

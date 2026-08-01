-- Amplía el archivo oficial de Primy para Euromillones.
alter table public.primy_draw_results
  add column if not exists secondary_numbers smallint[] not null default '{}'::smallint[];

alter table public.primy_draw_results
  drop constraint if exists primy_draw_results_game_id_check;

alter table public.primy_draw_results
  add constraint primy_draw_results_game_id_check
  check (game_id in ('primitiva', 'eurodreams', 'euromillones'));

alter table public.primy_draw_results
  drop constraint if exists primy_draw_results_six_numbers;

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
    (game_id in ('primitiva', 'eurodreams')
      and cardinality(winning_numbers) = 6
      and cardinality(secondary_numbers) = 0)
  );

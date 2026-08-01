create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

grant select on public.primy_draw_results to anon, authenticated;

drop policy if exists "primy_draw_results_public_read" on public.primy_draw_results;
create policy "primy_draw_results_public_read"
on public.primy_draw_results
for select
to anon, authenticated
using (true);

do $$
declare
  job record;
begin
  for job in
    select jobid from cron.job where jobname in (
      'primy-sync-selae-daily',
      'primy-sync-selae-evening',
      'primy-sync-selae-morning'
    )
  loop
    perform cron.unschedule(job.jobid);
  end loop;
end $$;

select cron.schedule(
  'primy-sync-selae-evening',
  '45 22 * * *',
  $cron$
    select net.http_post(
      url := 'https://vmzkhelxehgedorsvchl.supabase.co/functions/v1/scheduled-sync-selae',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{"mode":"latest","trigger":"evening"}'::jsonb,
      timeout_milliseconds := 60000
    );
  $cron$
);

select cron.schedule(
  'primy-sync-selae-morning',
  '15 7 * * *',
  $cron$
    select net.http_post(
      url := 'https://vmzkhelxehgedorsvchl.supabase.co/functions/v1/scheduled-sync-selae',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{"mode":"latest","trigger":"morning-fallback"}'::jsonb,
      timeout_milliseconds := 60000
    );
  $cron$
);

-- Primy v16.8: reduce the publication-to-availability delay for official results.
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

do $$
declare
  job record;
begin
  for job in
    select jobid from cron.job where jobname in (
      'primy-sync-selae-daily',
      'primy-sync-selae-evening',
      'primy-sync-selae-morning',
      'primy-sync-selae-fast-evening',
      'primy-sync-selae-late-fallback'
    )
  loop
    perform cron.unschedule(job.jobid);
  end loop;
end $$;

select cron.schedule(
  'primy-sync-selae-fast-evening',
  '*/5 19-23 * * *',
  $cron$
    select net.http_post(
      url := 'https://vmzkhelxehgedorsvchl.supabase.co/functions/v1/scheduled-sync-selae',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{"mode":"latest","trigger":"fast-evening"}'::jsonb,
      timeout_milliseconds := 60000
    );
  $cron$
);

select cron.schedule(
  'primy-sync-selae-late-fallback',
  '*/15 0-1 * * *',
  $cron$
    select net.http_post(
      url := 'https://vmzkhelxehgedorsvchl.supabase.co/functions/v1/scheduled-sync-selae',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{"mode":"latest","trigger":"late-fallback"}'::jsonb,
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

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

do $$
declare job record;
begin
  for job in select jobid from cron.job where jobname in ('primy-sync-sports-rounds-morning','primy-sync-sports-rounds-evening')
  loop perform cron.unschedule(job.jobid); end loop;
end $$;

select cron.schedule(
  'primy-sync-sports-rounds-morning',
  '30 6 * * *',
  $cron$
    select net.http_post(
      url := 'https://vmzkhelxehgedorsvchl.supabase.co/functions/v1/sync-sports-rounds',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{"trigger":"supabase-morning"}'::jsonb,
      timeout_milliseconds := 60000
    );
  $cron$
);

select cron.schedule(
  'primy-sync-sports-rounds-evening',
  '30 18 * * *',
  $cron$
    select net.http_post(
      url := 'https://vmzkhelxehgedorsvchl.supabase.co/functions/v1/sync-sports-rounds',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{"trigger":"supabase-evening"}'::jsonb,
      timeout_milliseconds := 60000
    );
  $cron$
);

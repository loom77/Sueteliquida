-- Complementa la ventana nocturna con comprobaciones para sorteos diurnos.
select cron.unschedule(jobid)
from cron.job
where jobname = 'primy-sync-selae-national-afternoon';

select cron.schedule(
  'primy-sync-selae-national-afternoon',
  '*/15 11-14 * * 4,6',
  $$
    select net.http_post(
      url := 'https://vmzkhelxehgedorsvchl.supabase.co/functions/v1/scheduled-sync-selae',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{"mode":"latest","trigger":"national-afternoon"}'::jsonb,
      timeout_milliseconds := 60000
    );
  $$
);

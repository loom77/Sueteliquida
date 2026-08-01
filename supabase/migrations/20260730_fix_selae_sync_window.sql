-- Primy v15.5.2: sincroniza resultados durante la ventana real de publicación.
-- pg_cron usa UTC; esta franja cubre verano e invierno en Europe/Madrid.
select cron.unschedule('primy-sync-selae-evening');

select cron.schedule(
  'primy-sync-selae-evening',
  '*/15 19-21 * * *',
  $$
    select net.http_post(
      url := 'https://vmzkhelxehgedorsvchl.supabase.co/functions/v1/scheduled-sync-selae',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{"mode":"latest","trigger":"evening-retry-window"}'::jsonb,
      timeout_milliseconds := 60000
    );
  $$
);

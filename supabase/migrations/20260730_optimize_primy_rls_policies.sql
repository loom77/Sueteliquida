drop policy if exists "primy_profiles_select_own" on public.primy_profiles;
create policy "primy_profiles_select_own" on public.primy_profiles
for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "primy_profiles_insert_own" on public.primy_profiles;
create policy "primy_profiles_insert_own" on public.primy_profiles
for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists "primy_profiles_update_own" on public.primy_profiles;
create policy "primy_profiles_update_own" on public.primy_profiles
for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "primy_plays_select_own" on public.primy_plays;
create policy "primy_plays_select_own" on public.primy_plays
for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "primy_plays_insert_own" on public.primy_plays;
create policy "primy_plays_insert_own" on public.primy_plays
for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "primy_plays_update_own" on public.primy_plays;
create policy "primy_plays_update_own" on public.primy_plays
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "primy_plays_delete_own" on public.primy_plays;
create policy "primy_plays_delete_own" on public.primy_plays
for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "primy_settings_select_own" on public.primy_user_settings;
create policy "primy_settings_select_own" on public.primy_user_settings
for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "primy_settings_insert_own" on public.primy_user_settings;
create policy "primy_settings_insert_own" on public.primy_user_settings
for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "primy_settings_update_own" on public.primy_user_settings;
create policy "primy_settings_update_own" on public.primy_user_settings
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "primy_migrations_select_own" on public.primy_data_migrations;
create policy "primy_migrations_select_own" on public.primy_data_migrations
for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "primy_migrations_insert_own" on public.primy_data_migrations;
create policy "primy_migrations_insert_own" on public.primy_data_migrations
for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "primy_migrations_update_own" on public.primy_data_migrations;
create policy "primy_migrations_update_own" on public.primy_data_migrations
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

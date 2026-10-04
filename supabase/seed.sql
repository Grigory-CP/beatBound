-- =============================================================================
-- beatBound: seed data (game content only, no user accounts)
-- Runs with: npx supabase db push --include-seed
-- Safe to re-run: existing rows are left alone.
-- =============================================================================

insert into public.enemies (name, max_health, attack_power, sprite_url) values
  ('Off-Key Goblin',     60,  8, null),
  ('Tempo Troll',        90, 12, null),
  ('Discord Dragon',    150, 20, null)
on conflict (name) do nothing;

-- Challenges: insert the parent row, then the matching Pitch/Rhythm row.
with c as (
  insert into public.challenges (type, title, level_number, difficulty, unlock_level, xp_reward)
  values ('PITCH', 'Match the Note', 1, 1, 1, 50)
  on conflict (level_number) do nothing
  returning challenge_id
)
insert into public.pitch_challenges (challenge_id, target_notes, tolerance_cents, hold_time_ms)
select challenge_id, array['C4'], 50, 800 from c;

with c as (
  insert into public.challenges (type, title, level_number, difficulty, unlock_level, xp_reward)
  values ('RHYTHM', 'Steady Beat', 2, 1, 1, 50)
  on conflict (level_number) do nothing
  returning challenge_id
)
insert into public.rhythm_challenges (challenge_id, beat_pattern, tempo_bpm, timing_window_ms)
select challenge_id, array[0, 1000, 2000, 3000], 60, 200 from c;

with c as (
  insert into public.challenges (type, title, level_number, difficulty, unlock_level, xp_reward)
  values ('PITCH', 'Major Triad', 3, 2, 2, 100)
  on conflict (level_number) do nothing
  returning challenge_id
)
insert into public.pitch_challenges (challenge_id, target_notes, tolerance_cents, hold_time_ms)
select challenge_id, array['C4', 'E4', 'G4'], 40, 600 from c;

with c as (
  insert into public.challenges (type, title, level_number, difficulty, unlock_level, xp_reward)
  values ('RHYTHM', 'Off-Beat Groove', 4, 3, 3, 150)
  on conflict (level_number) do nothing
  returning challenge_id
)
insert into public.rhythm_challenges (challenge_id, beat_pattern, tempo_bpm, timing_window_ms)
select challenge_id, array[0, 375, 1000, 1375, 2000, 2375], 80, 150 from c;

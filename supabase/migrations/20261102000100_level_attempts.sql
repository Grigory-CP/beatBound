begin;

grant select on public.challenges to anon, authenticated;
grant select on public.pitch_challenges to anon, authenticated;
grant select on public.rhythm_challenges to anon, authenticated;

create or replace function public.record_level_attempt(
  p_student_id uuid,
  p_level_number int,
  p_score int,
  p_accuracy numeric
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_challenge_id bigint;
  v_unlock_level integer;
  v_xp_reward integer;
  v_character_id bigint;
  v_old_level integer;
  v_xp integer;
  v_report_id bigint;
  v_was_completed boolean;
  v_passed boolean;
  v_first_clear boolean;
  v_xp_gained integer := 0;
  v_new_level integer;
  v_best_score integer;
  v_best_accuracy numeric;
  v_attempts integer;
  v_newly_unlocked integer[] := '{}'::integer[];
begin
  if p_score is null or p_score < 0
    or p_accuracy is null or p_accuracy < 0 or p_accuracy > 100 then
    raise exception 'invalid_attempt';
  end if;

  select c.challenge_id, c.unlock_level, c.xp_reward
  into v_challenge_id, v_unlock_level, v_xp_reward
  from public.challenges as c
  where c.level_number = p_level_number;
  if not found then
    raise exception 'level_not_found';
  end if;

  select ch.character_id, ch.level, ch.xp
  into v_character_id, v_old_level, v_xp
  from public.characters as ch
  where ch.student_id = p_student_id
  for update;
  if not found then
    raise exception 'student_not_found';
  end if;

  select sr.report_id
  into v_report_id
  from public.student_reports as sr
  where sr.student_id = p_student_id;
  if not found then
    raise exception 'student_not_found';
  end if;

  if v_unlock_level > v_old_level then
    raise exception 'level_locked';
  end if;

  v_passed := p_accuracy >= 70;

  select lp.completed
  into v_was_completed
  from public.level_progress as lp
  where lp.student_report_id = v_report_id
    and lp.challenge_id = v_challenge_id;

  insert into public.level_progress as lp (
    student_report_id,
    challenge_id,
    best_score,
    best_accuracy,
    attempts,
    completed,
    last_played_at
  )
  values (
    v_report_id,
    v_challenge_id,
    p_score,
    p_accuracy,
    1,
    v_passed,
    now()
  )
  on conflict (student_report_id, challenge_id) do update
  set attempts = lp.attempts + 1,
      best_score = greatest(lp.best_score, excluded.best_score),
      best_accuracy = greatest(lp.best_accuracy, excluded.best_accuracy),
      completed = lp.completed or v_passed,
      last_played_at = now()
  returning lp.best_score, lp.best_accuracy, lp.attempts
  into v_best_score, v_best_accuracy, v_attempts;

  v_first_clear := v_passed and not coalesce(v_was_completed, false);

  if v_first_clear then
    v_xp_gained := v_xp_reward;
    v_xp := v_xp + v_xp_gained;
    v_new_level := 1 + floor(v_xp::numeric / 100)::integer;

    update public.characters as ch
    set xp = v_xp,
        level = v_new_level
    where ch.character_id = v_character_id;

    insert into public.character_unlocks (character_id, challenge_id)
    select v_character_id, c.challenge_id
    from public.challenges as c
    where c.unlock_level <= v_new_level
    on conflict (character_id, challenge_id) do nothing;

    select coalesce(array_agg(c.level_number order by c.level_number), '{}'::integer[])
    into v_newly_unlocked
    from public.challenges as c
    where c.unlock_level > v_old_level
      and c.unlock_level <= v_new_level;
  else
    v_new_level := v_old_level;
  end if;

  update public.student_reports as sr
  set total_score = summary.total_score,
      average_accuracy = summary.average_accuracy
  from (
    select coalesce(sum(lp.best_score), 0)::integer as total_score,
           coalesce(round(avg(lp.best_accuracy), 2), 0)::numeric(5, 2) as average_accuracy
    from public.level_progress as lp
    where lp.student_report_id = v_report_id
  ) as summary
  where sr.report_id = v_report_id;

  return jsonb_build_object(
    'passed', v_passed,
    'first_clear', v_first_clear,
    'xp_gained', v_xp_gained,
    'xp', v_xp,
    'level', v_new_level,
    'leveled_up', v_new_level > v_old_level,
    'best_score', v_best_score,
    'best_accuracy', v_best_accuracy,
    'attempts', v_attempts,
    'newly_unlocked', v_newly_unlocked
  );
end;
$$;

revoke execute on function public.record_level_attempt(uuid, int, int, numeric)
  from public, anon, authenticated;
grant execute on function public.record_level_attempt(uuid, int, int, numeric)
  to service_role;

commit;

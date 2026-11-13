begin;

-- ---------- Read access for students (RLS) ----------------------------------
grant select on public.battles to authenticated;
grant select on public.characters to authenticated;
grant select on public.enemies to anon, authenticated;

drop policy if exists "students read own character" on public.characters;
create policy "students read own character"
  on public.characters
  for select
  to authenticated
  using (student_id = (select auth.uid()));

drop policy if exists "students read own battles" on public.battles;
create policy "students read own battles"
  on public.battles
  for select
  to authenticated
  using (
    character_id in (
      select ch.character_id
      from public.characters as ch
      where ch.student_id = (select auth.uid())
    )
  );

-- ---------- Helper: one JSON shape for every battle response ----------------
create or replace function public.battle_json(p_battle_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'battle_id', b.battle_id,
    'status', b.status,
    'outcome', case
      when b.status = 'COMPLETED' and b.enemy_health = 0 then 'WON'
      when b.status = 'COMPLETED' and b.player_health = 0 then 'LOST'
      else null
    end,
    'level_number', c.level_number,
    'challenge_type', c.type,
    'enemy', jsonb_build_object(
      'enemy_id', e.enemy_id,
      'name', e.name,
      'max_health', e.max_health,
      'attack_power', e.attack_power,
      'sprite_url', e.sprite_url
    ),
    'player_health', b.player_health,
    'player_max_health', ch.max_health,
    'enemy_health', b.enemy_health,
    'score', b.score,
    'accuracy', b.accuracy,
    'turns', coalesce((b.saved_state ->> 'turns')::integer, 0),
    'started_at', b.started_at,
    'ended_at', b.ended_at
  )
  into v_result
  from public.battles as b
  join public.challenges as c on c.challenge_id = b.challenge_id
  join public.enemies as e on e.enemy_id = b.enemy_id
  join public.characters as ch on ch.character_id = b.character_id
  where b.battle_id = p_battle_id;

  return v_result;
end;
$$;

-- ---------- start_battle ----------------------------------------------------
create or replace function public.start_battle(
  p_student_id uuid,
  p_level_number int
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_challenge_id bigint;
  v_difficulty integer;
  v_unlock_level integer;
  v_character_id bigint;
  v_level integer;
  v_max_health integer;
  v_enemy_count integer;
  v_enemy_id bigint;
  v_enemy_health integer;
  v_battle_id bigint;
begin
  select c.challenge_id, c.difficulty, c.unlock_level
  into v_challenge_id, v_difficulty, v_unlock_level
  from public.challenges as c
  where c.level_number = p_level_number;
  if not found then
    raise exception 'level_not_found';
  end if;

  select ch.character_id, ch.level, ch.max_health
  into v_character_id, v_level, v_max_health
  from public.characters as ch
  where ch.student_id = p_student_id
  for update;
  if not found then
    raise exception 'student_not_found';
  end if;

  if v_unlock_level > v_level then
    raise exception 'level_locked';
  end if;

  select count(*)::integer
  into v_enemy_count
  from public.enemies;
  if v_enemy_count = 0 then
    raise exception 'no_enemies';
  end if;

  select e.enemy_id, e.max_health
  into v_enemy_id, v_enemy_health
  from public.enemies as e
  order by e.max_health, e.enemy_id
  offset least(v_difficulty, v_enemy_count) - 1
  limit 1;

  update public.battles as b
  set status = 'ABANDONED',
      ended_at = now()
  where b.character_id = v_character_id
    and b.status in ('ACTIVE', 'PAUSED');

  insert into public.battles (
    character_id,
    challenge_id,
    enemy_id,
    status,
    score,
    accuracy,
    player_health,
    enemy_health,
    saved_state
  )
  values (
    v_character_id,
    v_challenge_id,
    v_enemy_id,
    'ACTIVE',
    0,
    0,
    v_max_health,
    v_enemy_health,
    '{"turns":0}'::jsonb
  )
  returning battle_id into v_battle_id;

  return public.battle_json(v_battle_id);
end;
$$;

-- ---------- submit_battle_turn ----------------------------------------------
create or replace function public.submit_battle_turn(
  p_student_id uuid,
  p_battle_id bigint,
  p_score int,
  p_accuracy numeric
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_battle public.battles%rowtype;
  v_classroom_id bigint;
  v_level_number integer;
  v_attack_power integer;
  v_old_turns integer;
  v_turns integer;
  v_player_damage integer;
  v_enemy_damage integer := 0;
  v_outcome text := 'ONGOING';
  v_level_result jsonb := null;
begin
  if p_score is null or p_score < 0
    or p_accuracy is null or p_accuracy < 0 or p_accuracy > 100 then
    raise exception 'invalid_turn';
  end if;

  select b.*
  into v_battle
  from public.battles as b
  join public.characters as ch on ch.character_id = b.character_id
  where b.battle_id = p_battle_id
    and ch.student_id = p_student_id
  for update of b;
  if not found then
    raise exception 'battle_not_found';
  end if;

  if v_battle.status <> 'ACTIVE' then
    raise exception 'battle_not_active';
  end if;

  select e.attack_power
  into v_attack_power
  from public.enemies as e
  where e.enemy_id = v_battle.enemy_id;

  select c.level_number
  into v_level_number
  from public.challenges as c
  where c.challenge_id = v_battle.challenge_id;

  v_player_damage := floor(p_accuracy * 0.3)::integer;
  v_battle.enemy_health := greatest(0, v_battle.enemy_health - v_player_damage);

  if v_battle.enemy_health > 0 then
    if p_accuracy >= 70 then
      v_enemy_damage := ceil(v_attack_power / 2.0)::integer;
    else
      v_enemy_damage := v_attack_power;
    end if;
    v_battle.player_health := greatest(0, v_battle.player_health - v_enemy_damage);
  end if;

  v_old_turns := coalesce((v_battle.saved_state ->> 'turns')::integer, 0);
  v_turns := v_old_turns + 1;
  v_battle.score := v_battle.score + p_score;
  v_battle.accuracy := round((v_battle.accuracy * v_old_turns + p_accuracy) / v_turns, 2);
  v_battle.saved_state := coalesce(v_battle.saved_state, '{}'::jsonb)
    || jsonb_build_object('turns', v_turns);

  if v_battle.enemy_health = 0 then
    v_outcome := 'WON';
  elsif v_battle.player_health = 0 then
    v_outcome := 'LOST';
  end if;

  update public.battles as b
  set enemy_health = v_battle.enemy_health,
      player_health = v_battle.player_health,
      score = v_battle.score,
      accuracy = v_battle.accuracy,
      saved_state = v_battle.saved_state,
      status = case when v_outcome = 'ONGOING' then b.status else 'COMPLETED' end,
      ended_at = case when v_outcome = 'ONGOING' then b.ended_at else now() end
  where b.battle_id = p_battle_id;

  if v_outcome = 'WON' then
    update public.student_reports as sr
    set battles_played = sr.battles_played + 1,
        battles_won = sr.battles_won + 1
    where sr.student_id = p_student_id;

    select s.classroom_id
    into v_classroom_id
    from public.students as s
    where s.user_id = p_student_id;

    update public.classroom_reports as cr
    set total_battles_won = cr.total_battles_won + 1
    where cr.classroom_id = v_classroom_id;

    v_level_result := public.record_level_attempt(
      p_student_id,
      v_level_number,
      v_battle.score,
      v_battle.accuracy
    );
  elsif v_outcome = 'LOST' then
    update public.student_reports as sr
    set battles_played = sr.battles_played + 1
    where sr.student_id = p_student_id;
  end if;

  return jsonb_build_object(
    'battle', public.battle_json(p_battle_id),
    'turn', jsonb_build_object(
      'player_damage', v_player_damage,
      'enemy_damage', v_enemy_damage
    ),
    'outcome', v_outcome,
    'level_result', v_level_result
  );
end;
$$;

-- ---------- set_battle_status (pause / resume / abandon) --------------------
create or replace function public.set_battle_status(
  p_student_id uuid,
  p_battle_id bigint,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.battle_status;
begin
  select b.status
  into v_status
  from public.battles as b
  join public.characters as ch on ch.character_id = b.character_id
  where b.battle_id = p_battle_id
    and ch.student_id = p_student_id
  for update of b;
  if not found then
    raise exception 'battle_not_found';
  end if;

  if p_action is null or p_action not in ('pause', 'resume', 'abandon') then
    raise exception 'invalid_action';
  end if;

  if p_action = 'pause' then
    if v_status <> 'ACTIVE' then
      raise exception 'battle_not_active';
    end if;
    update public.battles as b
    set status = 'PAUSED'
    where b.battle_id = p_battle_id;
  elsif p_action = 'resume' then
    if v_status <> 'PAUSED' then
      raise exception 'battle_not_active';
    end if;
    update public.battles as b
    set status = 'ACTIVE'
    where b.battle_id = p_battle_id;
  else
    if v_status not in ('ACTIVE', 'PAUSED') then
      raise exception 'battle_not_active';
    end if;
    update public.battles as b
    set status = 'ABANDONED',
        ended_at = now()
    where b.battle_id = p_battle_id;
  end if;

  return public.battle_json(p_battle_id);
end;
$$;

revoke execute on function public.battle_json(bigint)
  from public, anon, authenticated;
grant execute on function public.battle_json(bigint)
  to service_role;

revoke execute on function public.start_battle(uuid, int)
  from public, anon, authenticated;
grant execute on function public.start_battle(uuid, int)
  to service_role;

revoke execute on function public.submit_battle_turn(uuid, bigint, int, numeric)
  from public, anon, authenticated;
grant execute on function public.submit_battle_turn(uuid, bigint, int, numeric)
  to service_role;

revoke execute on function public.set_battle_status(uuid, bigint, text)
  from public, anon, authenticated;
grant execute on function public.set_battle_status(uuid, bigint, text)
  to service_role;

commit;

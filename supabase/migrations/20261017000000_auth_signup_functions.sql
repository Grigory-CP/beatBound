alter table public.students
  add column username text unique check (username ~ '^[a-z0-9_]{3,20}$');

create or replace function public.random_code(len integer)
returns text language sql volatile set search_path = '' as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32)::int + 1, 1), '')
  from generate_series(1, len);
$$;

create or replace function public.new_class_code()
returns text language plpgsql volatile set search_path = '' as $$
declare code text;
begin
  loop
    code := public.random_code(6);
    exit when not exists (select 1 from public.classrooms where class_code = code);
  end loop;
  return code;
end;
$$;

create or replace function public.new_parent_link_code()
returns text language plpgsql volatile set search_path = '' as $$
declare code text;
begin
  loop
    code := public.random_code(8);
    exit when not exists (select 1 from public.students where parent_link_code = code);
  end loop;
  return code;
end;
$$;

create or replace function public.create_teacher_profile(
  p_user_id uuid, p_display_name text, p_email text, p_school_name text default null)
returns void language plpgsql set search_path = '' as $$
begin
  insert into public.users (user_id, role, display_name, email)
  values (p_user_id, 'TEACHER', p_display_name, p_email);
  insert into public.teachers (user_id, school_name) values (p_user_id, p_school_name);
end;
$$;

create or replace function public.create_parent_profile(
  p_user_id uuid, p_display_name text, p_email text)
returns void language plpgsql set search_path = '' as $$
begin
  insert into public.users (user_id, role, display_name, email)
  values (p_user_id, 'PARENT', p_display_name, p_email);
  insert into public.parents (user_id) values (p_user_id);
end;
$$;

create or replace function public.create_student_profile(
  p_user_id uuid, p_username text, p_display_name text, p_class_code text)
returns bigint language plpgsql set search_path = '' as $$
declare v_class_id bigint;
begin
  select class_id into v_class_id from public.classrooms
  where class_code = upper(trim(p_class_code)) and is_active;
  if v_class_id is null then
    raise exception 'invalid_class_code' using errcode = 'P0001';
  end if;
  insert into public.users (user_id, role, display_name, email)
  values (p_user_id, 'STUDENT', p_display_name, null);
  insert into public.students (user_id, classroom_id, parent_link_code, username)
  values (p_user_id, v_class_id, public.new_parent_link_code(), lower(p_username));
  insert into public.student_reports (student_id) values (p_user_id);
  insert into public.characters (student_id, name) values (p_user_id, p_display_name);
  insert into public.game_settings (student_id) values (p_user_id);
  return v_class_id;
end;
$$;

create or replace function public.create_classroom(p_teacher_id uuid, p_name text)
returns table (class_id bigint, name text, class_code text, created_at timestamptz)
language plpgsql set search_path = '' as $$
declare v_id bigint;
begin
  insert into public.classrooms (teacher_id, name, class_code)
  values (p_teacher_id, p_name, public.new_class_code())
  returning classrooms.class_id into v_id;
  insert into public.classroom_reports (classroom_id) values (v_id);
  return query select c.class_id, c.name, c.class_code, c.created_at
    from public.classrooms c where c.class_id = v_id;
end;
$$;

revoke execute on function public.random_code(integer) from public, anon, authenticated;
revoke execute on function public.new_class_code() from public, anon, authenticated;
revoke execute on function public.new_parent_link_code() from public, anon, authenticated;
revoke execute on function public.create_teacher_profile(uuid, text, text, text) from public, anon, authenticated;
revoke execute on function public.create_parent_profile(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.create_student_profile(uuid, text, text, text) from public, anon, authenticated;
revoke execute on function public.create_classroom(uuid, text) from public, anon, authenticated;
grant execute on function public.random_code(integer) to service_role;
grant execute on function public.new_class_code() to service_role;
grant execute on function public.new_parent_link_code() to service_role;
grant execute on function public.create_teacher_profile(uuid, text, text, text) to service_role;
grant execute on function public.create_parent_profile(uuid, text, text) to service_role;
grant execute on function public.create_student_profile(uuid, text, text, text) to service_role;
grant execute on function public.create_classroom(uuid, text) to service_role;

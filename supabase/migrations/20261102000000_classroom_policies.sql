grant update (name, is_active) on public.classrooms to authenticated;

drop policy if exists "teachers update own classrooms" on public.classrooms;
create policy "teachers update own classrooms"
  on public.classrooms for update to authenticated
  using (teacher_id = (select auth.uid()))
  with check (teacher_id = (select auth.uid()));

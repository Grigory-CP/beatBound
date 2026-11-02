grant select on public.classrooms to authenticated;

drop policy if exists "teachers read own classrooms" on public.classrooms;
create policy "teachers read own classrooms"
  on public.classrooms
  for select
  to authenticated
  using (teacher_id = (select auth.uid()));

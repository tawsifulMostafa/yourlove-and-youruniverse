-- Run this after supabase-security-setup.sql.
-- Adds temporary room-code based Brain Battle for couples.

create table if not exists public.quiz_rooms (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  started_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'waiting',
  questions jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz,
  room_code text,
  participant_one_id uuid references auth.users(id) on delete cascade,
  participant_two_id uuid references auth.users(id) on delete cascade,
  started_at timestamptz,
  ends_at timestamptz,
  constraint quiz_rooms_questions_array_check check (jsonb_typeof(questions) = 'array')
);

alter table public.quiz_rooms
  drop constraint if exists quiz_rooms_status_check;

alter table public.quiz_rooms
  add constraint quiz_rooms_status_check check (status in ('waiting', 'active', 'finished'));

alter table public.quiz_rooms
  add column if not exists room_code text,
  add column if not exists participant_one_id uuid references auth.users(id) on delete cascade,
  add column if not exists participant_two_id uuid references auth.users(id) on delete cascade,
  add column if not exists started_at timestamptz,
  add column if not exists ends_at timestamptz;

update public.quiz_rooms
set status = 'finished',
    finished_at = coalesce(finished_at, now()),
    updated_at = now()
where room_code is null
  and status in ('waiting', 'active');

create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.quiz_rooms(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_index int not null,
  selected_answer text not null,
  is_correct boolean not null,
  created_at timestamptz not null default now(),
  constraint quiz_answers_question_index_check check (question_index >= 0)
);

drop index if exists quiz_rooms_active_one_per_couple_idx;
create unique index if not exists quiz_rooms_open_one_per_couple_idx
on public.quiz_rooms (couple_id)
where status in ('waiting', 'active');

create unique index if not exists quiz_rooms_room_code_key
on public.quiz_rooms (room_code)
where room_code is not null;

create index if not exists quiz_rooms_couple_created_idx
on public.quiz_rooms (couple_id, created_at desc);

create unique index if not exists quiz_answers_one_per_user_question_idx
on public.quiz_answers (room_id, user_id, question_index);

alter table public.quiz_rooms enable row level security;
alter table public.quiz_answers enable row level security;

drop policy if exists "Couple members can read quiz rooms" on public.quiz_rooms;
drop policy if exists "Couple members can read quiz answers" on public.quiz_answers;

create policy "Couple members can read quiz rooms"
on public.quiz_rooms for select
to authenticated
using (public.is_current_user_couple(couple_id));

create policy "Couple members can read quiz answers"
on public.quiz_answers for select
to authenticated
using (public.is_current_user_couple(couple_id));

create or replace function public.create_brain_battle_room(questions jsonb)
returns table(room_id uuid, room_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_couple_id public.profiles.couple_id%type;
  partner_id public.profiles.id%type;
  next_room_id public.quiz_rooms.id%type;
  next_code text;
begin
  if auth.uid() is null then
    raise exception 'Login required.';
  end if;

  if jsonb_typeof($1) <> 'array' or jsonb_array_length($1) <> 20 then
    raise exception 'Brain Battle must include exactly 20 questions.';
  end if;

  select couple_id into current_couple_id
  from public.profiles
  where id = auth.uid();

  if current_couple_id is null then
    raise exception 'Connect with your partner first.';
  end if;

  if exists (
    select 1 from public.couples
    where id = current_couple_id
      and disconnect_requested_at is not null
  ) then
    raise exception 'Your shared world is paused while disconnect is scheduled.';
  end if;

  select id into partner_id
  from public.profiles
  where couple_id = current_couple_id
    and id <> auth.uid()
  limit 1;

  if partner_id is null then
    raise exception 'Your partner has not joined yet.';
  end if;

  update public.quiz_rooms
  set status = 'finished',
      finished_at = coalesce(finished_at, now()),
      updated_at = now()
  where couple_id = current_couple_id
    and status in ('waiting', 'active');

  loop
    next_code := upper(substr(md5(gen_random_uuid()::text), 1, 6));
    exit when not exists (
      select 1 from public.quiz_rooms
      where quiz_rooms.room_code = next_code
        and status in ('waiting', 'active')
    );
  end loop;

  insert into public.quiz_rooms (
    couple_id,
    started_by,
    questions,
    status,
    room_code,
    participant_one_id
  )
  values (
    current_couple_id,
    auth.uid(),
    $1,
    'waiting',
    next_code,
    auth.uid()
  )
  returning id into next_room_id;

  return query select next_room_id, next_code;
end;
$$;

create or replace function public.join_brain_battle_room(join_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_couple_id public.profiles.couple_id%type;
  target_room public.quiz_rooms%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Login required.';
  end if;

  select couple_id into current_couple_id
  from public.profiles
  where id = auth.uid();

  if current_couple_id is null then
    raise exception 'Connect with your partner first.';
  end if;

  select * into target_room
  from public.quiz_rooms
  where room_code = upper(trim(join_code))
    and status = 'waiting'
  limit 1;

  if target_room.id is null or target_room.couple_id <> current_couple_id then
    raise exception 'Room not found.';
  end if;

  if target_room.participant_one_id = auth.uid() then
    raise exception 'You already created this room.';
  end if;

  update public.quiz_rooms
  set participant_two_id = auth.uid(),
      updated_at = now()
  where id = target_room.id
    and participant_two_id is null;

  return target_room.id;
end;
$$;

create or replace function public.start_brain_battle(target_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_room public.quiz_rooms%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Login required.';
  end if;

  select * into target_room
  from public.quiz_rooms
  where id = target_room_id;

  if target_room.id is null or not public.is_current_user_couple(target_room.couple_id) then
    raise exception 'Room not found.';
  end if;

  if target_room.status <> 'waiting' then
    raise exception 'This room already started.';
  end if;

  if auth.uid() not in (target_room.participant_one_id, target_room.participant_two_id) then
    raise exception 'Only room players can start.';
  end if;

  if target_room.participant_one_id is null or target_room.participant_two_id is null then
    raise exception 'Both players must join first.';
  end if;

  update public.quiz_rooms
  set status = 'active',
      started_by = auth.uid(),
      started_at = now(),
      ends_at = now() + interval '8 minutes',
      updated_at = now()
  where id = target_room.id;
end;
$$;

create or replace function public.finish_brain_battle(target_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.quiz_rooms
  set status = 'finished',
      finished_at = coalesce(finished_at, now()),
      updated_at = now()
  where id = target_room_id
    and public.is_current_user_couple(couple_id)
    and status = 'active';
end;
$$;

create or replace function public.answer_quiz_question(
  room_id uuid,
  question_index int,
  selected_answer text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_room public.quiz_rooms%rowtype;
  target_question jsonb;
  correct_answer text;
  question_count int;
begin
  if auth.uid() is null then
    raise exception 'Login required.';
  end if;

  select * into target_room
  from public.quiz_rooms
  where id = $1;

  if target_room.id is null or not public.is_current_user_couple(target_room.couple_id) then
    raise exception 'Room not found.';
  end if;

  if target_room.status <> 'active' then
    raise exception 'This battle is not active.';
  end if;

  if target_room.ends_at is not null and now() > target_room.ends_at then
    update public.quiz_rooms
    set status = 'finished',
        finished_at = coalesce(finished_at, now()),
        updated_at = now()
    where id = target_room.id;
    raise exception 'Time is up.';
  end if;

  if auth.uid() not in (target_room.participant_one_id, target_room.participant_two_id) then
    raise exception 'Only room players can answer.';
  end if;

  if exists (
    select 1 from public.couples
    where id = target_room.couple_id
      and disconnect_requested_at is not null
  ) then
    raise exception 'Your shared world is paused while disconnect is scheduled.';
  end if;

  question_count := jsonb_array_length(target_room.questions);

  if $2 < 0 or $2 >= question_count then
    raise exception 'Invalid question.';
  end if;

  target_question := target_room.questions -> $2;
  correct_answer := target_question ->> 'correctAnswer';

  insert into public.quiz_answers (
    room_id,
    couple_id,
    user_id,
    question_index,
    selected_answer,
    is_correct
  )
  values (
    target_room.id,
    target_room.couple_id,
    auth.uid(),
    $2,
    $3,
    $3 = correct_answer
  )
  on conflict (room_id, user_id, question_index) do nothing;

  if (
    select count(*)
    from public.quiz_answers
    where quiz_answers.room_id = target_room.id
      and quiz_answers.user_id in (target_room.participant_one_id, target_room.participant_two_id)
  ) >= question_count * 2 then
    update public.quiz_rooms
    set status = 'finished',
        finished_at = now(),
        updated_at = now()
    where id = target_room.id;
  end if;
end;
$$;

grant select on public.quiz_rooms to authenticated;
grant select on public.quiz_answers to authenticated;
grant execute on function public.create_brain_battle_room(jsonb) to authenticated;
grant execute on function public.join_brain_battle_room(text) to authenticated;
grant execute on function public.start_brain_battle(uuid) to authenticated;
grant execute on function public.finish_brain_battle(uuid) to authenticated;
grant execute on function public.answer_quiz_question(uuid, int, text) to authenticated;

notify pgrst, 'reload schema';

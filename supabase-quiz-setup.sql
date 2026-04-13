-- Run this after supabase-security-setup.sql.
-- Adds polling-based couple quiz battles.

create table if not exists public.quiz_rooms (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  started_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active',
  questions jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz,
  constraint quiz_rooms_status_check check (status in ('active', 'finished')),
  constraint quiz_rooms_questions_array_check check (jsonb_typeof(questions) = 'array')
);

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

create unique index if not exists quiz_rooms_active_one_per_couple_idx
on public.quiz_rooms (couple_id)
where status = 'active';

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

create or replace function public.start_quiz_battle(questions jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_couple_id public.profiles.couple_id%type;
  partner_id public.profiles.id%type;
  next_room_id public.quiz_rooms.id%type;
begin
  if auth.uid() is null then
    raise exception 'Login required.';
  end if;

  if jsonb_typeof(questions) <> 'array' or jsonb_array_length(questions) <> 20 then
    raise exception 'Quiz must include exactly 20 questions.';
  end if;

  select couple_id
  into current_couple_id
  from public.profiles
  where id = auth.uid();

  if current_couple_id is null then
    raise exception 'Connect with your partner first.';
  end if;

  if exists (
    select 1
    from public.couples
    where id = current_couple_id
      and disconnect_requested_at is not null
  ) then
    raise exception 'Your shared world is paused while disconnect is scheduled.';
  end if;

  select id
  into partner_id
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
    and status = 'active';

  insert into public.quiz_rooms (couple_id, started_by, questions)
  values (current_couple_id, auth.uid(), questions)
  returning id into next_room_id;

  return next_room_id;
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

  select *
  into target_room
  from public.quiz_rooms
  where id = room_id;

  if target_room.id is null or not public.is_current_user_couple(target_room.couple_id) then
    raise exception 'Quiz room not found.';
  end if;

  if target_room.status <> 'active' then
    raise exception 'This quiz is finished.';
  end if;

  if exists (
    select 1
    from public.couples
    where id = target_room.couple_id
      and disconnect_requested_at is not null
  ) then
    raise exception 'Your shared world is paused while disconnect is scheduled.';
  end if;

  question_count := jsonb_array_length(target_room.questions);

  if question_index < 0 or question_index >= question_count then
    raise exception 'Invalid question.';
  end if;

  target_question := target_room.questions -> question_index;
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
    question_index,
    selected_answer,
    selected_answer = correct_answer
  )
  on conflict (room_id, user_id, question_index) do nothing;

  if (
    select count(distinct user_id)
    from public.quiz_answers
    where quiz_answers.room_id = target_room.id
      and quiz_answers.question_index = question_index
  ) >= 2
  and question_index = question_count - 1 then
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
grant execute on function public.start_quiz_battle(jsonb) to authenticated;
grant execute on function public.answer_quiz_question(uuid, int, text) to authenticated;

notify pgrst, 'reload schema';

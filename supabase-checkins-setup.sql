-- Run this after supabase-security-setup.sql.
-- Adds daily low-effort couple check-ins.

create table if not exists public.couple_checkins (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  mood text not null,
  checkin_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.couple_checkins
  drop constraint if exists couple_checkins_mood_check;

alter table public.couple_checkins
  add constraint couple_checkins_mood_check check (
    mood in (
      'thinking_of_you',
      'miss_you',
      'need_a_hug',
      'proud_of_you',
      'good_morning_love',
      'good_night_love',
      'drink_water',
      'eat_on_time',
      'come_back_soon',
      'i_am_here',
      'you_are_safe_with_me',
      'i_believe_in_you',
      'smile_for_me',
      'take_rest',
      'i_love_your_voice',
      'cant_wait_to_talk',
      'today_felt_empty',
      'sending_a_virtual_hug',
      'you_made_my_day',
      'stay_close'
    )
  );

create unique index if not exists couple_checkins_one_per_day_key
on public.couple_checkins (couple_id, user_id, checkin_date);

alter table public.couple_checkins enable row level security;

drop policy if exists "Couple members can read checkins" on public.couple_checkins;
drop policy if exists "Couple members can create own checkins" on public.couple_checkins;
drop policy if exists "Couple members can update own checkins" on public.couple_checkins;
drop policy if exists "Couple members can delete own checkins" on public.couple_checkins;

create policy "Couple members can read checkins"
on public.couple_checkins for select
to authenticated
using (public.is_current_user_couple(couple_id));

create policy "Couple members can create own checkins"
on public.couple_checkins for insert
to authenticated
with check (
  public.is_current_user_couple(couple_id)
  and user_id = auth.uid()
  and not exists (
    select 1
    from public.couples
    where id = couple_checkins.couple_id
      and disconnect_requested_at is not null
  )
);

create policy "Couple members can update own checkins"
on public.couple_checkins for update
to authenticated
using (
  public.is_current_user_couple(couple_id)
  and user_id = auth.uid()
)
with check (
  public.is_current_user_couple(couple_id)
  and user_id = auth.uid()
);

create policy "Couple members can delete own checkins"
on public.couple_checkins for delete
to authenticated
using (
  public.is_current_user_couple(couple_id)
  and user_id = auth.uid()
);

notify pgrst, 'reload schema';

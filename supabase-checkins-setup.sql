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
    mood ~ '^(daily_love_care|cute_romantic|fun_teasing_playful|apology_emotional|support_motivation|night_missing_you)_[0-9]{3}$'
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

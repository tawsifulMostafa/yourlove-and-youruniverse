-- Run this after supabase-security-setup.sql.
-- Adds partner-to-partner custom dares.

alter table public.couples
  add column if not exists dare_done_count int not null default 0;

create table if not exists public.couple_dares (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  dare_text text not null,
  status text not null default 'sent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  accepted_at timestamptz,
  declined_at timestamptz,
  done_at timestamptz,
  constraint couple_dares_status_check check (status in ('sent', 'accepted', 'declined', 'done')),
  constraint couple_dares_no_self_dare_check check (sender_id <> receiver_id),
  constraint couple_dares_text_length_check check (char_length(trim(dare_text)) between 3 and 240)
);

update public.couples
set dare_done_count = dare_done_count + existing_counts.done_count
from (
  select couple_id, count(*)::int as done_count
  from public.couple_dares
  where status = 'done'
  group by couple_id
) existing_counts
where couples.id = existing_counts.couple_id;

delete from public.couple_dares
where status in ('declined', 'done');

create index if not exists couple_dares_couple_created_at_idx
on public.couple_dares (couple_id, created_at desc);

create index if not exists couple_dares_receiver_status_idx
on public.couple_dares (receiver_id, status);

alter table public.couple_dares enable row level security;

drop policy if exists "Couple members can read dares" on public.couple_dares;

create policy "Couple members can read dares"
on public.couple_dares for select
to authenticated
using (public.is_current_user_couple(couple_id));

create or replace function public.send_partner_dare(dare_text text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_couple_id public.profiles.couple_id%type;
  partner_id public.profiles.id%type;
  next_dare_id public.couple_dares.id%type;
  cleaned_text text;
begin
  if auth.uid() is null then
    raise exception 'Login required.';
  end if;

  cleaned_text := trim(coalesce(dare_text, ''));

  if char_length(cleaned_text) < 3 then
    raise exception 'Dare is too short.';
  end if;

  if char_length(cleaned_text) > 240 then
    raise exception 'Dare must be 240 characters or less.';
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

  insert into public.couple_dares (couple_id, sender_id, receiver_id, dare_text)
  values (current_couple_id, auth.uid(), partner_id, cleaned_text)
  returning id into next_dare_id;

  return next_dare_id;
end;
$$;

create or replace function public.respond_partner_dare(dare_id uuid, next_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_dare public.couple_dares%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Login required.';
  end if;

  if next_status not in ('accepted', 'declined') then
    raise exception 'Invalid dare response.';
  end if;

  select *
  into target_dare
  from public.couple_dares
  where id = dare_id;

  if target_dare.id is null then
    raise exception 'Dare not found.';
  end if;

  if target_dare.receiver_id <> auth.uid() then
    raise exception 'Only the receiver can respond to this dare.';
  end if;

  if target_dare.status <> 'sent' then
    raise exception 'This dare has already been responded to.';
  end if;

  if not public.is_current_user_couple(target_dare.couple_id) then
    raise exception 'Dare not found.';
  end if;

  if exists (
    select 1
    from public.couples
    where id = target_dare.couple_id
      and disconnect_requested_at is not null
  ) then
    raise exception 'Your shared world is paused while disconnect is scheduled.';
  end if;

  if next_status = 'declined' then
    delete from public.couple_dares
    where id = target_dare.id;
  else
    update public.couple_dares
    set status = 'accepted',
        updated_at = now(),
        accepted_at = now()
    where id = target_dare.id;
  end if;
end;
$$;

create or replace function public.confirm_partner_dare(dare_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_dare public.couple_dares%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Login required.';
  end if;

  select *
  into target_dare
  from public.couple_dares
  where id = dare_id;

  if target_dare.id is null then
    raise exception 'Dare not found.';
  end if;

  if target_dare.sender_id <> auth.uid() then
    raise exception 'Only the sender can confirm this dare.';
  end if;

  if target_dare.status <> 'accepted' then
    raise exception 'The dare must be accepted before it can be completed.';
  end if;

  if not public.is_current_user_couple(target_dare.couple_id) then
    raise exception 'Dare not found.';
  end if;

  if exists (
    select 1
    from public.couples
    where id = target_dare.couple_id
      and disconnect_requested_at is not null
  ) then
    raise exception 'Your shared world is paused while disconnect is scheduled.';
  end if;

  update public.couples
  set dare_done_count = dare_done_count + 1
  where id = target_dare.couple_id;

  delete from public.couple_dares
  where id = target_dare.id;
end;
$$;

grant select on public.couple_dares to authenticated;
grant execute on function public.send_partner_dare(text) to authenticated;
grant execute on function public.respond_partner_dare(uuid, text) to authenticated;
grant execute on function public.confirm_partner_dare(uuid) to authenticated;

notify pgrst, 'reload schema';

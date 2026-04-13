-- Run this in Supabase SQL Editor to enable the 24-hour disconnect grace window.
alter table public.profiles
  add column if not exists updated_at timestamptz;

alter table public.couples
  add column if not exists disconnect_requested_at timestamptz,
  add column if not exists disconnect_delete_after timestamptz,
  add column if not exists disconnect_requested_by uuid references auth.users(id) on delete set null;

alter table public.memories
  add column if not exists memory_date date;

create unique index if not exists couples_invite_code_key
on public.couples (invite_code);

create extension if not exists pgcrypto with schema extensions;

create or replace function public.generate_secure_invite_code(code_length int default 8)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  output text := '';
  random_bytes bytea;
  byte_value int;
  index_value int;
begin
  random_bytes := gen_random_bytes(code_length);

  for index_value in 0..(code_length - 1) loop
    byte_value := get_byte(random_bytes, index_value);
    output := output || substr(chars, (byte_value % length(chars)) + 1, 1);
  end loop;

  return output;
end;
$$;

create or replace function public.create_couple_invite()
returns table(couple_id public.couples.id%type, invite_code public.couples.invite_code%type)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_couple_id public.profiles.couple_id%type;
  next_invite_code public.couples.invite_code%type;
  next_couple_id public.couples.id%type;
  attempt int := 0;
begin
  select profiles.couple_id
  into current_couple_id
  from public.profiles
  where id = auth.uid();

  if auth.uid() is null then
    raise exception 'Login required.';
  end if;

  if current_couple_id is not null then
    raise exception 'You already have a shared space. Reset or disconnect first.';
  end if;

  loop
    attempt := attempt + 1;
    next_invite_code := public.generate_secure_invite_code(8);

    begin
      insert into public.couples (invite_code, created_by)
      values (next_invite_code, auth.uid())
      returning id into next_couple_id;

      exit;
    exception
      when unique_violation then
        if attempt >= 10 then
          raise exception 'Could not create a unique invite code. Please try again.';
        end if;
    end;
  end loop;

  update public.profiles
  set couple_id = next_couple_id,
      updated_at = now()
  where id = auth.uid();

  couple_id := next_couple_id;
  invite_code := next_invite_code;
  return next;
end;
$$;

create or replace function public.join_couple_invite(join_code text)
returns table(couple_id public.couples.id%type)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_couple_id public.profiles.couple_id%type;
  target_couple public.couples%rowtype;
  existing_member_count int;
  normalized_code text;
begin
  if auth.uid() is null then
    raise exception 'Login required.';
  end if;

  normalized_code := upper(regexp_replace(trim(coalesce(join_code, '')), '\s+', '', 'g'));

  if normalized_code = '' then
    raise exception 'Invite code is required.';
  end if;

  select profiles.couple_id
  into current_couple_id
  from public.profiles
  where id = auth.uid();

  if current_couple_id is not null then
    raise exception 'You already have a shared space. Reset or disconnect first.';
  end if;

  select *
  into target_couple
  from public.couples
  where invite_code = normalized_code;

  if target_couple.id is null then
    raise exception 'Invalid invite code.';
  end if;

  if target_couple.disconnect_requested_at is not null then
    raise exception 'This shared space is paused while disconnect is scheduled.';
  end if;

  select count(*)
  into existing_member_count
  from public.profiles
  where profiles.couple_id = target_couple.id;

  if existing_member_count >= 2 then
    raise exception 'This invite already has two people connected.';
  end if;

  update public.profiles
  set couple_id = target_couple.id,
      updated_at = now()
  where id = auth.uid();

  couple_id := target_couple.id;
  return next;
end;
$$;

create or replace function public.reset_empty_invite_space()
returns void
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  current_couple_id public.profiles.couple_id%type;
  existing_member_count int;
begin
  if auth.uid() is null then
    raise exception 'Login required.';
  end if;

  select profiles.couple_id
  into current_couple_id
  from public.profiles
  where id = auth.uid();

  if current_couple_id is null then
    raise exception 'No invite space found.';
  end if;

  select count(*)
  into existing_member_count
  from public.profiles
  where profiles.couple_id = current_couple_id;

  if existing_member_count > 1 then
    raise exception 'A partner is already connected. Use the 24-hour disconnect flow.';
  end if;

  delete from storage.objects
  where bucket_id = 'memories'
    and (storage.foldername(name))[1] = current_couple_id::text;

  delete from public.memories
  where memories.couple_id = current_couple_id;

  delete from public.letters
  where letters.couple_id = current_couple_id;

  update public.profiles
  set couple_id = null,
      updated_at = now()
  where id = auth.uid();

  delete from public.couples
  where id = current_couple_id;
end;
$$;

create or replace function public.request_partner_disconnect()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_couple_id public.profiles.couple_id%type;
begin
  select couple_id
  into current_couple_id
  from public.profiles
  where id = auth.uid();

  if current_couple_id is null then
    raise exception 'No connected partner found.';
  end if;

  update public.couples
  set
    disconnect_requested_at = now(),
    disconnect_delete_after = now() + interval '24 hours',
    disconnect_requested_by = auth.uid()
  where id = current_couple_id;
end;
$$;

create or replace function public.cancel_partner_disconnect()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_couple_id public.profiles.couple_id%type;
begin
  select couple_id
  into current_couple_id
  from public.profiles
  where id = auth.uid();

  if current_couple_id is null then
    raise exception 'No connected partner found.';
  end if;

  update public.couples
  set
    disconnect_requested_at = null,
    disconnect_delete_after = null,
    disconnect_requested_by = null
  where id = current_couple_id;
end;
$$;

create or replace function public.cleanup_expired_disconnects()
returns void
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  target_couple_id public.couples.id%type;
begin
  for target_couple_id in
    select id
    from public.couples
    where disconnect_delete_after is not null
      and disconnect_delete_after <= now()
  loop
    delete from storage.objects
    where bucket_id = 'memories'
      and (storage.foldername(name))[1] = target_couple_id::text;

    delete from public.memories
    where couple_id = target_couple_id;

    delete from public.letters
    where couple_id = target_couple_id;

    update public.profiles
    set couple_id = null,
        updated_at = now()
    where couple_id = target_couple_id;

    delete from public.couples
    where id = target_couple_id;
  end loop;
end;
$$;

grant execute on function public.request_partner_disconnect() to authenticated;
grant execute on function public.cancel_partner_disconnect() to authenticated;
grant execute on function public.cleanup_expired_disconnects() to authenticated;
grant execute on function public.generate_secure_invite_code(int) to authenticated;
grant execute on function public.create_couple_invite() to authenticated;
grant execute on function public.join_couple_invite(text) to authenticated;
grant execute on function public.reset_empty_invite_space() to authenticated;

create extension if not exists pg_cron with schema extensions;

do $$
begin
  if exists (
    select 1
    from cron.job
    where jobname = 'yourlove-cleanup-expired-disconnects'
  ) then
    perform cron.unschedule('yourlove-cleanup-expired-disconnects');
  end if;
end;
$$;

select cron.schedule(
  'yourlove-cleanup-expired-disconnects',
  '*/15 * * * *',
  $$select public.cleanup_expired_disconnects();$$
);

notify pgrst, 'reload schema';

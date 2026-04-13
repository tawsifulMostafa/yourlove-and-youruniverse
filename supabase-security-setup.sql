-- Run this after the profile and disconnect setup SQL files.
-- It tightens row-level security and storage access for production.

create or replace function public.current_user_couple_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select couple_id
  from public.profiles
  where id = auth.uid()
  limit 1
$$;

create or replace function public.is_current_user_couple(target_couple_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_couple_id is not null
    and target_couple_id = public.current_user_couple_id()
$$;

create or replace function public.can_access_avatar(owner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select owner_id = auth.uid()
    or exists (
      select 1
      from public.profiles owner_profile
      where owner_profile.id = owner_id
        and owner_profile.couple_id is not null
        and owner_profile.couple_id = public.current_user_couple_id()
    )
$$;

create or replace function public.is_current_user_couple_path(target_couple_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when target_couple_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.is_current_user_couple(target_couple_id::uuid)
    else false
  end
$$;

create or replace function public.can_access_avatar_path(owner_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when owner_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.can_access_avatar(owner_id::uuid)
    else false
  end
$$;

grant execute on function public.current_user_couple_id() to authenticated;
grant execute on function public.is_current_user_couple(uuid) to authenticated;
grant execute on function public.can_access_avatar(uuid) to authenticated;
grant execute on function public.is_current_user_couple_path(text) to authenticated;
grant execute on function public.can_access_avatar_path(text) to authenticated;

alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.letters enable row level security;
alter table public.memories enable row level security;

drop policy if exists "Users can read own or partner profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can read own or partner profile"
on public.profiles for select
to authenticated
using (
  id = auth.uid()
  or (
    couple_id is not null
    and couple_id = public.current_user_couple_id()
  )
);

create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check (
  id = auth.uid()
  and couple_id is null
);

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and couple_id is not distinct from public.current_user_couple_id()
);

drop policy if exists "Users can read own couple" on public.couples;

create policy "Users can read own couple"
on public.couples for select
to authenticated
using (public.is_current_user_couple(id));

drop policy if exists "Couple members can read letters" on public.letters;
drop policy if exists "Couple members can create letters" on public.letters;
drop policy if exists "Couple members can update letters" on public.letters;
drop policy if exists "Couple members can delete letters" on public.letters;

create policy "Couple members can read letters"
on public.letters for select
to authenticated
using (public.is_current_user_couple(couple_id));

create policy "Couple members can create letters"
on public.letters for insert
to authenticated
with check (
  public.is_current_user_couple(couple_id)
  and sender_id = auth.uid()
  and not exists (
    select 1
    from public.couples
    where id = letters.couple_id
      and disconnect_requested_at is not null
  )
);

create policy "Couple members can update letters"
on public.letters for update
to authenticated
using (public.is_current_user_couple(couple_id))
with check (public.is_current_user_couple(couple_id));

create policy "Couple members can delete letters"
on public.letters for delete
to authenticated
using (public.is_current_user_couple(couple_id));

drop policy if exists "Couple members can read memories" on public.memories;
drop policy if exists "Couple members can create memories" on public.memories;
drop policy if exists "Couple members can update memories" on public.memories;
drop policy if exists "Couple members can delete memories" on public.memories;

create policy "Couple members can read memories"
on public.memories for select
to authenticated
using (public.is_current_user_couple(couple_id));

create policy "Couple members can create memories"
on public.memories for insert
to authenticated
with check (
  public.is_current_user_couple(couple_id)
  and user_id = auth.uid()
  and not exists (
    select 1
    from public.couples
    where id = memories.couple_id
      and disconnect_requested_at is not null
  )
);

create policy "Couple members can update memories"
on public.memories for update
to authenticated
using (public.is_current_user_couple(couple_id))
with check (public.is_current_user_couple(couple_id));

create policy "Couple members can delete memories"
on public.memories for delete
to authenticated
using (public.is_current_user_couple(couple_id));

drop policy if exists "Users can view their own avatars" on storage.objects;
drop policy if exists "Users can upload their own avatars" on storage.objects;
drop policy if exists "Users can update their own avatars" on storage.objects;
drop policy if exists "Users can delete their own avatars" on storage.objects;
drop policy if exists "Users can view own or partner avatars" on storage.objects;
drop policy if exists "Users can upload own avatars" on storage.objects;
drop policy if exists "Users can update own avatars" on storage.objects;
drop policy if exists "Users can delete own avatars" on storage.objects;

create policy "Users can view own or partner avatars"
on storage.objects for select
to authenticated
using (
  bucket_id = 'avatars'
  and public.can_access_avatar_path((storage.foldername(name))[1])
);

create policy "Users can upload own avatars"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update own avatars"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete own avatars"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Couple members can view memory images" on storage.objects;
drop policy if exists "Couple members can upload memory images" on storage.objects;
drop policy if exists "Couple members can update memory images" on storage.objects;
drop policy if exists "Couple members can delete memory images" on storage.objects;

create policy "Couple members can view memory images"
on storage.objects for select
to authenticated
using (
  bucket_id = 'memories'
  and public.is_current_user_couple_path((storage.foldername(name))[1])
);

create policy "Couple members can upload memory images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'memories'
  and public.is_current_user_couple_path((storage.foldername(name))[1])
);

create policy "Couple members can update memory images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'memories'
  and public.is_current_user_couple_path((storage.foldername(name))[1])
)
with check (
  bucket_id = 'memories'
  and public.is_current_user_couple_path((storage.foldername(name))[1])
);

create policy "Couple members can delete memory images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'memories'
  and public.is_current_user_couple_path((storage.foldername(name))[1])
);

notify pgrst, 'reload schema';

# YourLove Supabase Setup Checklist

Use this when setting up a fresh Supabase project or checking production settings.

## 1. Auth URLs

- Google OAuth redirect URL in Google Cloud:
  - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
- Supabase Auth site URL:
  - local: `http://localhost:3000`
  - production: your deployed app URL
- Supabase Auth redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/auth/reset-password`
  - production `/auth/callback`
  - production `/auth/reset-password`
- Email auth:
  - password login enabled
  - email OTP/magic code enabled for new-device verification
  - password recovery redirect points to `/auth/reset-password`

## 2. Storage

- Bucket: `avatars`
  - private bucket
  - users can upload/update/delete their own avatar
  - users can view their own avatar and their connected partner avatar
- Bucket: `memories`
  - private bucket
  - object path starts with `couple_id`
  - only members of that couple can view/upload/update/delete memory images

## 3. SQL Files To Run

Run in this order:

1. `supabase-profile-setup.sql`
  - profile photo fields
  - `avatars` bucket creation
2. `supabase-disconnect-setup.sql`
  - 24-hour disconnect columns
  - optional `memories.memory_date`
  - secure invite RPCs
  - empty invite reset RPC
  - unique invite code index
  - disconnect cleanup function
  - `pg_cron` cleanup schedule
3. `supabase-security-setup.sql`
  - RLS policies for `profiles`, `couples`, `letters`, `memories`
  - storage policies for `avatars` and `memories`
  - helper functions used by policies
4. `supabase-checkins-setup.sql`
  - `couple_checkins` table
  - one check-in per user per couple per day
  - RLS policies for same-couple read and own check-in write
5. `supabase-dares-setup.sql`
  - `couple_dares` table
  - `couples.dare_done_count` counter
  - same-couple read policy
  - RPCs for sending, accepting/declining, and confirming partner dares
6. `supabase-quiz-setup.sql`
  - `quiz_rooms` and `quiz_answers` tables
  - same-couple read policies
  - RPCs for starting a quiz battle and answering questions

If a policy already exists error appears, run the newest SQL file again; these files use `drop policy if exists` for the app-owned policy names.

## 4. Invite Safety

- `couples.invite_code` must have a unique index.
- New invite creation should use `create_couple_invite()`.
- Joining should use `join_couple_invite(join_code text)`.
- Resetting an unused one-person invite space should use `reset_empty_invite_space()`.
- Direct client insert into `couples` should not be used.
- Direct client join by updating `profiles.couple_id` should not be used.

## 5. Disconnect Cleanup

- Cron job name: `yourlove-cleanup-expired-disconnects`
- Expected behavior:
  - pending disconnect pauses the shared space immediately
  - either partner can cancel within 24 hours
  - after 24 hours, shared letters, memories, memory storage objects, and the couple row are removed
  - both profiles lose `couple_id`
- Cron verification query:
  - `select jobname, active from cron.job where jobname = 'yourlove-cleanup-expired-disconnects';`
- Function verification query:
  - `select routine_name from information_schema.routines where routine_schema = 'public' and routine_name in ('create_couple_invite', 'join_couple_invite', 'reset_empty_invite_space', 'request_partner_disconnect', 'cancel_partner_disconnect');`

## 6. RLS / Storage Checks

- User A can load their own profile.
- User A can load connected partner profile preview.
- User A cannot read another unrelated user's profile.
- Couple A cannot read Couple B letters or memories.
- A memory image signed URL can be created only by a member of that memory's couple.
- Avatar signed URL works for self and connected partner, not unrelated users.

## 7. Manual Launch Checks

- Google signup redirects to `/auth/setup-password`.
- Password setup appears before Navbar/app UI.
- Email login works only after password setup.
- Unknown forgot-password email shows `User not found`.
- One-person invite space shows waiting state and can be reset.
- Two-person couple uses the 24-hour disconnect flow instead of reset.
- Pending disconnect blocks new letters and memories.
- Connected users can send one daily check-in and update it the same day.
- Partner can see today's check-in on Home.
- Connected users can send custom dares.
- Dare receiver can accept or decline.
- Dare sender can confirm accepted dares as done.
- Done dares disappear and increment `dare_done_count`; declined dares disappear.
- Connected users can start a 20-question Quiz Battle.
- Both partners see the same quiz room and scores update after polling.
- Eternal Mode stays locked below Love Level 10 and unlocks at Level 10.

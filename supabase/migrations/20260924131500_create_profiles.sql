-- One profile per auth user. The profile id is the auth user id, so a user can
-- only ever have one profile and it is removed when the auth user is deleted.
create table public.profiles (
  id uuid not null,
  full_name text not null
    check (char_length(btrim(full_name)) between 1 and 100),
  department text
    check (char_length(department) <= 100),
  job_title text
    check (char_length(job_title) <= 100),
  bio text
    check (char_length(bio) <= 1000),
  location text
    check (char_length(location) <= 100),
  interests text[] not null default '{}'
    check (cardinality(interests) <= 20),
  photo_url text
    check (char_length(photo_url) <= 2048 and photo_url ~* '^https://'),
  contact_url text
    check (char_length(contact_url) <= 2048 and contact_url ~* '^(https://|mailto:)'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign key (id)
    references auth.users (id) on delete cascade
);

comment on table public.profiles is 'Employee directory profile, one per auth user.';
comment on column public.profiles.job_title is 'The employee''s role at the company.';

create index profiles_department_idx on public.profiles (department);

create function public.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_profile_updated_at();

-- Backstop in case a future grant re-exposes id. Applies to every role,
-- including the SQL editor; ownership is never meant to move.
create function public.prevent_profile_id_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'profiles.id cannot be changed'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_id_change
  before update of id on public.profiles
  for each row
  execute function public.prevent_profile_id_change();

-- Supabase grants every privilege on new public tables to anon and
-- authenticated by default. Replace that with the minimum needed.
-- Column-level grants keep clients from writing created_at/updated_at and from
-- changing id after insert; RLS below restricts which rows they can touch.
revoke all on public.profiles from anon, authenticated;

grant select on public.profiles to authenticated;

grant insert (
  id, full_name, department, job_title, bio, location,
  interests, photo_url, contact_url
) on public.profiles to authenticated;

grant update (
  full_name, department, job_title, bio, location,
  interests, photo_url, contact_url
) on public.profiles to authenticated;

alter table public.profiles enable row level security;

create policy "Authenticated users can read profiles"
  on public.profiles
  for select
  to authenticated
  using (true);

create policy "Users can create their own profile"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

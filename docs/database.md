# Database

Schema changes live in `supabase/migrations/` as timestamped SQL files
(`YYYYMMDDHHMMSS_description.sql`). Apply them in filename order and never edit
a migration after it has been applied; add a new one instead.

## `profiles` table

Created by `supabase/migrations/20260924131500_create_profiles.sql`.

| Column        | Type          | Notes                                                    |
| ------------- | ------------- | -------------------------------------------------------- |
| `id`          | `uuid`        | Primary key; references `auth.users(id)`, cascade delete |
| `full_name`   | `text`        | Required, 1–100 characters (ignoring surrounding spaces) |
| `department`  | `text`        | Optional, up to 100 characters                           |
| `job_title`   | `text`        | Optional, up to 100 characters (the employee's role)     |
| `bio`         | `text`        | Optional, up to 1000 characters                          |
| `location`    | `text`        | Optional, up to 100 characters                           |
| `interests`   | `text[]`      | Defaults to empty; at most 20 entries                    |
| `photo_url`   | `text`        | Optional; must start with `https://`                     |
| `contact_url` | `text`        | Optional; must start with `https://` or `mailto:`        |
| `created_at`  | `timestamptz` | Set on insert                                            |
| `updated_at`  | `timestamptz` | Set on insert and by trigger on every update             |

`profiles.id` is the primary key (`profiles_pkey`) and also a foreign key to
`auth.users.id` (`profiles_id_fkey`, `on delete cascade`). So each auth user
has at most one profile, and each profile belongs to exactly one auth user.

Access rules:

- Row Level Security is enabled.
- `anon` has no privileges on the table, so anonymous requests get
  `permission denied`.
- `authenticated` users can read every profile.
- `authenticated` users can insert and update only the row whose `id` equals
  their own `auth.uid()`.
- Clients can't write `created_at` or `updated_at`, and can't change `id`
  after insert. Column-level grants enforce this. A trigger,
  `profiles_prevent_id_change`, also rejects any change to `id` from any
  role.
- There is no delete policy. A profile is deleted when its auth user is
  deleted.

The app uses only the publishable key (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). Never
put the service-role key in this app or in any `NEXT_PUBLIC_` variable,
because it bypasses Row Level Security.

## Applying the migration

The migration creates everything from scratch. It fails with
`relation "profiles" already exists` if the table is already there, and in
that case nothing is changed. If your project already has a `profiles` table,
complete [Replacing an existing profiles table](#replacing-an-existing-profiles-table)
first.

### Option A: Supabase dashboard

1. Open your project at https://supabase.com/dashboard and go to
   **SQL Editor** → **New query**.
2. Paste the full contents of
   `supabase/migrations/20260924131500_create_profiles.sql` and click
   **Run**. You should see "Success. No rows returned."
3. Open **Table Editor** → `profiles` and confirm the columns and the
   **RLS enabled** badge.

The dashboard doesn't record which migrations were applied. If you later
switch to the CLI, mark this one as applied, so the CLI doesn't re-run it:

```bash
npx supabase migration repair --status applied 20260924131500
```

### Option B: Supabase CLI

The CLI isn't a project dependency. `npx` downloads it on demand.

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

`<your-project-ref>` is the ID in your project URL
(`https://<project-ref>.supabase.co`). `link` asks for the database password.
`db push` applies every migration in `supabase/migrations/` that hasn't been
applied yet and records it in `supabase_migrations.schema_migrations`.

## Replacing an existing profiles table

Use this section if `profiles` was created earlier, for example in the Table
Editor or by an older version of this migration. Every step is manual. Nothing
is deleted until you choose to delete it.

1. **Inspect the current constraints.** Query `pg_constraint`, not
   `information_schema`. Views like `information_schema.constraint_column_usage`
   only list tables owned by your current role. `auth.users` is owned by
   `supabase_auth_admin`, so a foreign key pointing at it can be missing from
   those views even when it exists.

   ```sql
   select conname, contype, pg_get_constraintdef(oid) as definition
   from pg_constraint
   where conrelid = 'public.profiles'::regclass
   order by contype, conname;
   ```

2. **Back up the existing rows** to a schema that the API doesn't expose:

   ```sql
   create schema if not exists private;
   create table private.profiles_backup as table public.profiles;
   select count(*) from private.profiles_backup;
   ```

3. **Find orphaned profiles.** These are rows whose `id` has no matching auth
   user. They can't be restored under the new foreign key.

   ```sql
   select backup.*
   from private.profiles_backup as backup
   where not exists (
     select 1 from auth.users as auth_user where auth_user.id = backup.id
   );
   ```

   For each orphaned profile, decide what to do. If the person still needs
   access, invite them from **Authentication** → **Users** and restore their
   data under the new user id in step 6. If the row is stale or test data,
   leave it in the backup. It won't be restored.

4. **Drop the old table** once the backup count matches:

   ```sql
   drop table public.profiles;
   ```

   This also removes the old table's policies and triggers. The migration
   recreates them.

5. **Apply the migration** using option A or B above.

6. **Restore rows that have a matching auth user.** Adjust the column list to
   match the columns your old table actually had.

   ```sql
   insert into public.profiles (id, full_name, department, job_title, bio, location, interests, photo_url, contact_url, created_at)
   select backup.id, backup.full_name, backup.department, backup.job_title, backup.bio,
          backup.location, coalesce(backup.interests, '{}'), backup.photo_url, backup.contact_url, backup.created_at
   from private.profiles_backup as backup
   where exists (select 1 from auth.users as auth_user where auth_user.id = backup.id);
   ```

   If a row fails a check constraint (for example, a `photo_url` that uses
   `http://`), fix that value in the backup and re-run the insert.

7. When you've confirmed the restored data, drop the backup with
   `drop table private.profiles_backup;`. Don't add `private` to the exposed
   schemas under **Project Settings** → **API**.

## Verifying the schema

Run these as `postgres` in **SQL Editor**:

```sql
-- Primary key and foreign key (expect profiles_pkey and profiles_id_fkey ... ON DELETE CASCADE)
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.profiles'::regclass and contype in ('p', 'f');

-- Clients can't update id (expect false, false)
select has_column_privilege('authenticated', 'public.profiles', 'id', 'UPDATE') as authenticated_can_update_id,
       has_column_privilege('anon', 'public.profiles', 'id', 'UPDATE') as anon_can_update_id;

-- Normal profile fields are updatable (expect true)
select has_column_privilege('authenticated', 'public.profiles', 'full_name', 'UPDATE') as can_update_full_name;

-- Policies (expect 3 rows: select, insert, update; all for authenticated)
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'profiles';

-- Triggers (expect profiles_prevent_id_change and profiles_set_updated_at)
select tgname from pg_trigger
where tgrelid = 'public.profiles'::regclass and not tgisinternal;
```

## Verifying the policies

Run each block in **SQL Editor** as its own query. Every block ends in
`rollback`, so it leaves no data behind. Before you start, create two users
under **Authentication** → **Users** → **Add user**, then copy their UUIDs into
the placeholders `USER_A_ID` and `USER_B_ID`.

The SQL Editor runs as `postgres`, which bypasses RLS. Each block switches to
the `anon` or `authenticated` role and sets JWT claims so that `auth.uid()`
behaves as it would for a signed-in user.

1. **Anonymous users can't read profiles.** Expected result:
   `permission denied for table profiles`.

   ```sql
   begin;
   set local role anon;
   select * from public.profiles;
   rollback;
   ```

2. **A user can insert their own profile.** Expected result: one row returned.

   ```sql
   begin;
   set local role authenticated;
   select set_config('request.jwt.claims', '{"sub":"USER_A_ID","role":"authenticated"}', true);
   insert into public.profiles (id, full_name) values ('USER_A_ID', 'Ada Lovelace');
   select id, full_name from public.profiles;
   rollback;
   ```

3. **A user can't create a profile for someone else.** Expected result:
   `new row violates row-level security policy for table "profiles"`.

   ```sql
   begin;
   set local role authenticated;
   select set_config('request.jwt.claims', '{"sub":"USER_A_ID","role":"authenticated"}', true);
   insert into public.profiles (id, full_name) values ('USER_B_ID', 'Not Me');
   rollback;
   ```

4. **Authenticated users can read others; a user can update only their own
   row; `id` can't be reassigned.** Run as `postgres` first to seed both
   rows, then switch to user A. Expected results: the `select` returns 2
   rows, the first update reports 1 row, and the second update reports 0
   rows. The final `update ... set id` fails with
   `permission denied for table profiles`.

   ```sql
   begin;
   insert into public.profiles (id, full_name) values
     ('USER_A_ID', 'Ada Lovelace'),
     ('USER_B_ID', 'Alan Turing');
   set local role authenticated;
   select set_config('request.jwt.claims', '{"sub":"USER_A_ID","role":"authenticated"}', true);
   select id, full_name from public.profiles;
   update public.profiles set bio = 'Analyst' where id = 'USER_A_ID';
   update public.profiles set bio = 'Hacked' where id = 'USER_B_ID';
   update public.profiles set id = 'USER_B_ID' where id = 'USER_A_ID';
   rollback;
   ```

5. **Constraints reject bad data.** Expected result: a check-constraint
   violation (`profiles_photo_url_check`).

   ```sql
   begin;
   insert into public.profiles (id, full_name, photo_url)
   values ('USER_A_ID', 'Ada Lovelace', 'http://insecure.example.com/a.png');
   rollback;
   ```

6. **The trigger blocks id changes even for `postgres`.** Expected result:
   `profiles.id cannot be changed`.

   ```sql
   begin;
   insert into public.profiles (id, full_name) values ('USER_A_ID', 'Ada Lovelace');
   update public.profiles set id = 'USER_B_ID' where id = 'USER_A_ID';
   rollback;
   ```

7. **Dashboard check.** Go to **Authentication** → **Policies** → `profiles`.
   You should see exactly three policies (select, insert, update), all for
   the `authenticated` role.

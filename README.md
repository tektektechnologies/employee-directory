# Mathematics, Inc. Employee Directory

An internal directory where Mathematics, Inc. employees find colleagues and
keep their own profile up to date.

- Register with email and password, confirm the email, and sign in.
- New users set up a profile (name, role, department, location, bio,
  interests, optional photo and contact link) before they reach the directory.
- The directory shows colleagues as cards, with name search and a department
  filter. Each card opens the full profile at `/people/[id]`.
- Everyone can edit only their own profile.

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, and
Supabase (Auth, Postgres, Storage).

## Local setup

Requirements: Node.js 20.9 or newer, npm, and a Supabase project.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` from the template and fill in both values (see
   [Environment variables](#environment-variables)):

   ```bash
   cp .env.example .env.local
   ```

3. Apply the database migration (see [Database migration](#database-migration)).

4. In Supabase, go to **Authentication → URL Configuration**. Set **Site URL**
   to `http://localhost:3000` and add `http://localhost:3000/**` under
   **Redirect URLs**. [docs/auth.md](docs/auth.md) explains each Auth setting.

5. Start the app and open http://localhost:3000:

   ```bash
   npm run dev
   ```

## Environment variables

| Variable                               | Where to find it                                                          | Notes |
| -------------------------------------- | ------------------------------------------------------------------------- | ----- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase → **Project Settings → Data API** (Project URL)                  | `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → **Project Settings → API Keys** → Publishable key (`sb_publishable_...`) | Safe in the browser; all access is limited by Row Level Security |

These are the only two. Both are `NEXT_PUBLIC_`, so Next.js builds them into
the browser bundle. That means:

- They must be set **before** building. After changing them on Vercel,
  redeploy.
- The build fails with a clear message if either is missing, so a
  misconfigured deploy never goes live.
- Never add the secret or service-role key to this app or to any
  `NEXT_PUBLIC_` variable. It bypasses Row Level Security, and the app doesn't
  need it.

`.env*` files are git-ignored except `.env.example`, which holds only
placeholders.

## Database migration

Everything the app needs is created by one migration:
`supabase/migrations/20260924131500_create_profiles.sql`. It creates:

- the `profiles` table, with its constraints, triggers, grants, and RLS policies;
- the private `avatars` Storage bucket and its policies.

To apply it in the dashboard, open **SQL Editor → New query**, paste the whole
file, and click **Run**. You should see "Success. No rows returned." To use
the Supabase CLI instead, or to replace an existing `profiles` table, see
[docs/database.md](docs/database.md). That doc also has a verification
checklist.

Run it once per Supabase project. It fails without changing anything if the
table or bucket already exists.

## Deploying to Vercel

The app deploys with Vercel's defaults, so there is no `vercel.json`.
Vercel detects Next.js, runs `npm install` and `npm run build`, and picks a
Node version that matches `engines` in `package.json`.

### 1. Connect GitHub to Vercel

1. Push this repository to GitHub.
2. Go to https://vercel.com and choose **Sign Up** or **Log In** →
   **Continue with GitHub**, and authorize Vercel.
3. On your dashboard, click **Add New… → Project**.
4. Under **Import Git Repository**, find the repository and click
   **Import**. If it isn't listed, click **Adjust GitHub App Permissions**,
   grant the Vercel app access to the repository (or to all repositories),
   save, and return to the import page.
5. On **Configure Project**:
   - **Framework Preset:** Next.js (detected automatically)
   - **Root Directory:** `./`
   - **Build and Output Settings:** leave the defaults
   - Expand **Environment Variables** and add both variables from the table
     above, with the same values as your `.env.local`.
6. Click **Deploy**. When it finishes, note the production address shown on
   the project page, for example `https://employee-directory.vercel.app`.
   It's also listed under **Settings → Domains**.
7. Open **Settings → Environment Variables** and confirm both variables are
   enabled for **Production** and **Preview**. Preview deployments of other
   branches and pull requests need them too.

From now on, every push to `main` deploys to production, and every other
branch or pull request gets a preview deployment.

### 2. Configure Supabase for the production URL

In the Supabase dashboard for the same project:

1. **Authentication → URL Configuration**
   - **Site URL:** your production address, for example
     `https://employee-directory.vercel.app` (no trailing slash). Supabase
     uses it when no redirect is given, and it's what `{{ .SiteURL }}` means
     in email templates.
   - **Redirect URLs:** click **Add URL** for each of these:
     - `https://employee-directory.vercel.app/auth/confirm**`, using your
       production address. This is where confirmation links land.
     - `https://*-<your-vercel-team-or-username>.vercel.app/**`, for preview
       deployments. The slug is the last part of any preview address, for
       example `employee-directory-git-feature-acme.vercel.app` → `acme`.
     - `http://localhost:3000/**`, to keep local development working.
   - Click **Save**.
2. **Authentication → Sign In / Providers → Email**
   - Keep **Enable Email provider** and **Confirm email** on.
   - Set **Minimum password length** to at least 8, to match the form.
3. **Authentication → Emails → SMTP Settings** (strongly recommended for real
   use). Supabase's built-in sender only allows a few emails per hour and is
   meant for testing. Turn on **Enable Custom SMTP** and enter your provider's
   details (for example Resend, Postmark, or SES).
4. **Authentication → Emails → Templates → Confirm signup:** no change is
   needed. The default link works when it's opened in the same browser the
   user registered in. See [docs/auth.md](docs/auth.md) for the optional
   any-device template.

If you add a custom domain in Vercel (**Settings → Domains**), repeat step 1
with that domain.

### 3. Check the production deployment

In a private browser window:

1. Open the production URL, register with a real email, and confirm that the
   "Check your inbox" screen appears.
2. Open the email link in the same window. You should land on **Set up your
   profile** on the production domain, not localhost.
3. Save a profile with a photo. The directory should open with your card.
4. Sign out, then visit `/directory`. You should be sent to sign-in.

If the confirmation link opens `localhost` or the home page signed out, the
Site URL or Redirect URLs from step 2.1 are wrong.

## How it works

### Architecture decisions

- **Server-first rendering.** Pages are React Server Components that read
  data on the server with the user's session. Writes go through Server
  Actions. The only client components are forms, navigation state, and the
  photo picker.
- **Session handling follows `@supabase/ssr`.** `proxy.ts` (Next 16's
  replacement for middleware) refreshes the session cookie on every request
  and redirects signed-out visitors away from protected paths.
- **Identity is always verified.** The proxy and every protected page and
  action call `supabase.auth.getClaims()`, which verifies the token's
  signature. `getSession()` is never trusted on the server.
- **The database is the authority.** Row Level Security and column-level
  grants decide who can read and write. App checks are for better error
  messages, not for security.
- **Insert or update, not upsert.** Clients can't write `id` after insert, so
  a profile save inserts the first time and updates afterwards. Upsert would
  try to write `id`.
- **Filters live in the URL.** The directory search is a plain GET form
  (`?q=&department=`). Results can be shared and bookmarked, and survive a
  refresh.
- **Photos upload directly to Storage.** The browser uploads the file to a
  private bucket using the user's session. The profile stores only the file
  path, and pages show photos through signed URLs that expire after an hour.
  File bytes never pass through the Next.js server.
- **Departments are a fixed list** in `lib/profiles/fields.ts`, shared by the
  profile form, the server check, and the directory filter.
- **Few dependencies.** Apart from Next.js and React, the only runtime
  packages are Supabase's two libraries. There's no UI kit, form library, or
  ORM.

### Security model

- **Keys:** the app uses only the publishable key. There's no service-role
  key anywhere, and the repository contains no real keys.
- **Profiles:**
  - Anonymous requests are denied.
  - Signed-in users can read all profiles.
  - Users can insert and update only the row whose `id` is their own
    `auth.uid()`. A trigger rejects any change to `id`, even from the SQL
    editor.
  - The database's check constraints enforce field lengths and link formats.
- **Photos:**
  - The bucket is private and only signed-in users can view photos.
  - Each user can write only inside a folder named after their user id.
  - Storage enforces the 2 MB limit and the JPG, PNG, and WebP types.
  - A database constraint stops a profile from pointing at another user's
    photo.
- **Redirects:**
  - After sign-in or confirmation, the app only follows same-site paths, so
    `?next=` can't send users off-site.
  - Supabase only sends confirmation links to allow-listed URLs.
- **Requests:** Next.js rejects Server Action requests whose `Origin` doesn't
  match the host.
- **Links:** contact links must be `https://` or a plain `mailto:` address.
  They're checked when saved and again when shown.
- **Headers:** every response sends `X-Content-Type-Options`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, and `Permissions-Policy`.
- **Data exposure:** email addresses and user ids are never shown in the
  directory.

See [docs/auth.md](docs/auth.md) and [docs/database.md](docs/database.md) for
the details.

## Tests and checks

```bash
npm test        # Vitest unit tests (no database needed)
npm run lint    # ESLint
npm run build   # production build, including type checking
```

The tests cover:

- signed-out access to protected pages;
- safe `?next=` redirects;
- saving only your own profile, and ignoring an `id` added to the form;
- validation, including departments, photo paths, and links;
- directory filtering;
- photo cleanup after a save.

Supabase is replaced by a small fake client that records every query.

Row Level Security can't be checked by unit tests. Follow the two-account
steps in [docs/testing.md](docs/testing.md) against a real project, and see
the SQL checks in [docs/database.md](docs/database.md).

## Known tradeoffs

- **Email confirmation works in the registering browser only.** Supabase's
  default link carries a one-time code that only that browser can exchange.
  The optional template in [docs/auth.md](docs/auth.md) works on any device.
- **The built-in email sender is rate limited.** It sends only a few emails
  per hour. Production needs custom SMTP.
- **Previews share the production database.** With the setup above, preview
  deployments use the same Supabase project. For separate data, create a
  second Supabase project and set its keys for the **Preview** environment
  only.
- **No pagination.** The directory loads every matching profile, which is
  fine for hundreds of people but not tens of thousands.
- **Departments are checked by the app, not the database.** The column still
  accepts any text. Profiles saved before the fixed list keep their old
  department until edited, and can't be found through the filter.
- **Photos can be left behind.**
  - A photo uploaded but never saved stays in Storage.
  - Deleting a profile row or an auth user doesn't delete their photos.
  - Replaced and removed photos are cleaned up.
- **Photo links expire.** Signed URLs last an hour, so a page left open
  longer needs a refresh to show photos.
- **The session cookie is readable by JavaScript.** `@supabase/ssr` needs
  this so the browser client can upload photos. React escapes all rendered
  content, but there is no Content Security Policy yet.
- **Deleting a profile doesn't delete the account.** The person can still
  sign in and is asked to set up a profile again. Delete users under
  **Authentication → Users**, which also removes their profile.

## Project structure

```
app/
  layout.tsx          Root layout, metadata, skip link
  page.tsx            Landing page
  icon.png            Favicon
  (auth)/             Sign-in and registration pages and server actions
  (protected)/        Signed-in pages: /directory, /people/[id], /profile/edit
  auth/confirm/       Email confirmation link handler
components/           Shared form fields, status messages, avatar, and styles
lib/
  auth/               Verified-user checks and safe redirect helpers
  profiles/           Profile validation, departments, directory queries, photos
  supabase/           Server, browser, and proxy Supabase clients
proxy.ts              Session refresh and route protection on every request
next.config.ts        Security headers
tests/                Vitest tests
docs/
  auth.md             Auth design and Supabase Auth settings
  database.md         Schema, access rules, applying and verifying the migration
  testing.md          Test coverage and manual two-account RLS checks
supabase/
  migrations/         The SQL migration
```

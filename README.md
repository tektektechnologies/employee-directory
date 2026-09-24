# Mathematics, Inc. Employee Directory

## Project purpose

An internal directory where Mathematics, Inc. employees can find colleagues,
see which team they belong to, and keep their own profile up to date. It is
built with Next.js (App Router), TypeScript, and Tailwind CSS, and will use
Supabase for authentication and data.

Current status: registration, email confirmation, sign-in, and sign-out work.
New users set up their profile before they reach the directory, and
`/profile/edit` handles later changes. The directory lists colleagues as cards,
with name search and a department filter. Person pages are protected but still
show placeholders.

## Local setup

Requirements: Node.js 20.9 or newer and npm.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your local environment file and fill in the values from your
   Supabase project (Project Settings → API Keys):

   ```bash
   cp .env.example .env.local
   ```

   | Variable                               | Purpose                                              |
   | -------------------------------------- | ---------------------------------------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`             | Your Supabase project URL                            |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your publishable key (`sb_publishable_...`), which is safe to expose to browsers |

   `.env.local` and other `.env*` files are git-ignored; only `.env.example`
   is committed. Never commit real keys.

3. Apply the database migrations in `supabase/migrations/` to your Supabase
   project. See [docs/database.md](docs/database.md) for step-by-step
   instructions and a policy verification checklist.

4. Configure Supabase Auth URLs for localhost. See
   [docs/auth.md](docs/auth.md#supabase-settings-for-localhost).

5. Start the development server and open http://localhost:3000:

   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` — start the development server
- `npm run lint` — run ESLint
- `npm run build` — create a production build
- `npm run start` — serve the production build

## Project structure

```
app/
  layout.tsx          Root layout and metadata
  page.tsx            Landing page
  (auth)/             Sign-in and registration pages and server actions
  (protected)/        Signed-in pages: /directory, /people/[id], /profile/edit
  auth/confirm/       Email confirmation link handler
components/           Shared form components
lib/
  auth/               Verified-user checks and safe redirect helpers
  supabase/           Server, browser, and proxy Supabase clients
proxy.ts              Session refresh and route protection on every request
docs/
  auth.md             Auth design and Supabase URL settings
  database.md         Schema, access rules, and how to apply migrations
supabase/
  migrations/         Versioned SQL migrations, applied in filename order
```

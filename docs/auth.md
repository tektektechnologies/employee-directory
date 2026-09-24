# Authentication

The app uses Supabase Auth with email and password, through `@supabase/ssr`.
Sessions are stored in cookies, so server-rendered pages know who is signed in.

## How it fits together

| Piece                                 | Role                                                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `lib/supabase/server.ts`              | Server client for Server Components, Server Actions, and Route Handlers                                |
| `lib/supabase/client.ts`              | Browser client for Client Components (not used yet)                                                    |
| `proxy.ts` + `lib/supabase/proxy.ts`  | Runs on every request. Refreshes the session cookie and redirects signed-out visitors away from protected paths |
| `lib/auth/verified-user.ts`           | `getVerifiedUser()` / `requireVerifiedUser()`, the identity check used by pages and server code        |
| `lib/auth/redirects.ts`               | Protected path list and the safe `?next=` destination check                                            |
| `app/(auth)/actions.ts`               | Sign-in and registration server actions                                                                |
| `app/auth/confirm/route.ts`           | Completes email confirmation links                                                                     |
| `app/(protected)/actions.ts`          | Sign-out server action                                                                                 |

Protected routes are `/directory`, `/people/[id]`, and `/profile/edit`.

- **Identity is always verified.** The proxy and every protected page call
  `supabase.auth.getClaims()`, which verifies the access token's signature.
  Server code never authorizes from `getSession()`, because it returns
  whatever the cookie contains.
- **Pages check again.** The proxy redirect is a convenience. Each protected
  page and any future server action calls `requireVerifiedUser()` itself, and
  database access is still limited by Row Level Security.
- **Safe destinations.** A signed-out visitor to a protected page is sent to
  `/sign-in?next=<original path>` and returned there after signing in or
  confirming their email. `next` must be a same-site path starting with `/`.
  Anything else falls back to `/directory`.
- **Only the public key.** The app uses only the publishable key
  (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). The secret or service-role
  key isn't used anywhere.

## Supabase settings for localhost

In the Supabase dashboard for your project:

1. **Authentication → URL Configuration**
   - **Site URL:** `http://localhost:3000`
   - **Redirect URLs:** add `http://localhost:3000/**`

   Registration sends
   `http://localhost:3000/auth/confirm?next=/directory` (or the page the user
   started from) as the email redirect. Supabase only honors redirect URLs on
   this allow list. If the URL isn't listed, Supabase silently falls back to
   the Site URL, the link lands on the home page, and the user isn't signed
   in. For a narrower rule, use `http://localhost:3000/auth/confirm**`
   instead.

   When you deploy, add your production origin the same way (for example
   `https://directory.example.com/**`) and change the Site URL to it.

2. **Authentication → Sign In / Providers → Email**
   - Keep **Enable Email provider** on.
   - **Confirm email:** either setting works. When on, registration shows a
     "check your email" message. When off, the user is signed in immediately
     and redirected.
   - Set **Minimum password length** to 8 or more so it matches the form's
     check.

3. **Authentication → Emails → Templates → Confirm signup** (recommended).
   By default, the email link uses a one-time `code`. The app can only
   exchange that code in the same browser the user registered in. To make
   confirmation work on any device, change the link in the template to:

   ```html
   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm your email</a>
   ```

   With this template, users land on `/directory` after confirming rather than
   the page they started from. `/auth/confirm` handles both link formats, so
   the app works with or without this change.

Supabase's built-in email service only allows a few emails per hour and is
intended for testing. If sign-ups start failing with a rate-limit message,
wait, or configure custom SMTP under **Authentication → Emails → SMTP Settings**.

## Manual test checklist

1. Visit `/directory` while signed out. You're redirected to
   `/sign-in?next=%2Fdirectory`.
2. Register with a new email.
   - With confirmation on: a success message asks you to check your email.
     Click the link and you land on `/directory`, signed in.
   - With confirmation off: you're redirected to `/directory` right away.
3. Submit the forms with an invalid email, a short password, and mismatched
   passwords. Each field shows its own error, and screen readers announce the
   summary.
4. Sign in with a wrong password. The message reads "That email and password
   don't match an account."
5. Visit `/people/some-id` while signed out, then sign in. You return to
   `/people/some-id`.
6. Try `/sign-in?next=https://example.com`. After signing in you land on
   `/directory`, not the external site.
7. Click **Sign out**. You return to the home page, and `/directory` redirects
   to sign-in again.
8. Open an old or already-used confirmation link. You see "That confirmation
   link is invalid or has expired."

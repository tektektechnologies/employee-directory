# Testing

## Automated tests

```bash
npm test
```

The tests run with [Vitest](https://vitest.dev) in Node and don't need a
Supabase project. They cover the highest-risk behavior:

| File                                   | What it proves                                                                                                   |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `tests/unauthenticated-access.test.ts` | Signed-out requests to `/directory`, `/people/[id]`, and `/profile/edit` redirect to sign-in with a safe `next`. Verified users pass. Refreshed cookies survive the redirect. `next` can't point off-site. |
| `tests/profile-save.test.ts`           | Saving writes only the signed-in user's row. The first save inserts under their id, and a duplicate insert becomes an update. An `id` smuggled into the form is ignored. Signed-out saves touch nothing. The old photo file is deleted only after a new one is saved. |
| `tests/profile-validation.test.ts`     | Required fields, length limits, the fixed department list, interest rules, photo paths limited to your own folder, and the `https`/`mailto` link rules shared by saving and rendering. |
| `tests/directory-filters.test.ts`      | Search and department combine with AND. Unknown departments in the URL are ignored. `%` and `_` are literal. No email is selected. Load errors stay distinct from empty results. |

Supabase is replaced by a small recording fake (`tests/support/fake-supabase.ts`)
that captures the queries the app builds. **It doesn't enforce Row Level
Security.** The tests prove the app never asks to write another user's row.
Only the database can prove it refuses when asked. Check that with the manual
steps below.

## Manual RLS verification with two real accounts

These steps call the real Supabase API with each user's own access token,
exactly as a malicious client could. They use only the publishable key, never
the secret or service-role key.

### Setup

1. Apply the migration (see [database.md](database.md)).
2. Register two test accounts in the app, **A** and **B**, confirm both, and
   complete each profile so both rows exist.
3. In the dashboard, open **Authentication → Users** and copy both user UUIDs.
4. Open a PowerShell window and paste the following block, filling in the
   placeholders. It runs in your session only, so don't save it with the
   passwords in it.

```powershell
$SupabaseUrl    = "https://<project-ref>.supabase.co"
$PublishableKey = "<your sb_publishable_... key>"
$UserAId        = "<user A uuid>"
$UserBId        = "<user B uuid>"

function Get-AccessToken($Email, $Password) {
  $credentials = @{ email = $Email; password = $Password } | ConvertTo-Json
  (Invoke-RestMethod -Method Post -Uri "$SupabaseUrl/auth/v1/token?grant_type=password" `
    -Headers @{ apikey = $PublishableKey } -ContentType "application/json" -Body $credentials).access_token
}

function Invoke-ProfilesRequest($Method, $Query, $AccessToken, $Body) {
  $headers = @{ apikey = $PublishableKey; Prefer = "return=representation" }
  if ($AccessToken) { $headers.Authorization = "Bearer $AccessToken" }
  $request = @{ Method = $Method; Uri = "$SupabaseUrl/rest/v1/profiles$Query"; Headers = $headers
                ContentType = "application/json"; UseBasicParsing = $true }
  if ($Body) { $request.Body = $Body | ConvertTo-Json }
  try {
    $response = Invoke-WebRequest @request
    "$($response.StatusCode) $($response.Content)"
  } catch {
    $errorResponse = $_.Exception.Response
    $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
    "$([int]$errorResponse.StatusCode) $($reader.ReadToEnd())"
  }
}

$TokenA = Get-AccessToken "<user A email>" "<user A password>"
```

### Checks

Run each command and compare with the expected result.

| # | Check                                    | Command                                                                                              | Expected                                                        |
| - | ---------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 1 | Anonymous users can't read profiles      | `Invoke-ProfilesRequest GET "?select=full_name" $null`                                               | `401` with `"code":"42501"` (permission denied)                 |
| 2 | A signed-in user can read others         | `Invoke-ProfilesRequest GET "?select=id,full_name" $TokenA`                                          | `200`, a list that includes both A and B                        |
| 3 | A can edit their own profile             | `Invoke-ProfilesRequest PATCH "?id=eq.$UserAId" $TokenA @{ bio = "Updated by A" }`                   | `200`, one row returned with the new bio                        |
| 4 | A can't edit B's profile                 | `Invoke-ProfilesRequest PATCH "?id=eq.$UserBId" $TokenA @{ bio = "Changed by A" }`                   | `200 []`. No rows match, and B's bio is unchanged               |
| 5 | A can't create a profile for B           | `Invoke-ProfilesRequest POST "" $TokenA @{ id = $UserBId; full_name = "Fake B" }`                    | `403` with `"code":"42501"` and "violates row-level security"   |
| 6 | A can't move their profile to B's id     | `Invoke-ProfilesRequest PATCH "?id=eq.$UserAId" $TokenA @{ id = $UserBId }`                          | `401` or `403` with `"code":"42501"` (permission denied)        |
| 7 | A can't delete any profile               | `Invoke-ProfilesRequest DELETE "?id=eq.$UserBId" $TokenA`                                            | `401` or `403` with `"code":"42501"`                            |
| 8 | A can't forge timestamps                 | `Invoke-ProfilesRequest PATCH "?id=eq.$UserAId" $TokenA @{ created_at = "2000-01-01T00:00:00Z" }`    | `401` or `403` with `"code":"42501"`                            |

After check 4, confirm in **Table Editor → profiles** that B's `bio` is still
what B saved. A `200` with an empty list is the expected RLS behavior for
updates: the row is invisible to the update, so nothing changes.

Repeat checks 3 to 5 with the roles swapped (get `$TokenB` for B and target A)
to confirm the policies are symmetric.

### In-app checks

1. Sign in as A and open B's profile from the directory. There should be no
   **Edit profile** button.
2. As A, open `/profile/edit`. The form must show A's details, never B's.
3. Sign out and open `/people/<B's uuid>`. You should be redirected to
   sign-in, and after signing in you should return to B's profile.

When you're done, delete the test accounts under **Authentication → Users**.
Their profiles are removed automatically.

// Read as literal process.env properties so Next.js can inline them into the
// browser bundle.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function getSupabaseEnv() {
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Locally, copy .env.example to .env.local and fill in both values. On Vercel, add both under Project Settings → Environment Variables and redeploy.",
    );
  }
  return { url, key };
}

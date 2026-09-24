import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";

export type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export async function createSupabaseServerClient() {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components can't write cookies. The proxy refreshes the
          // session on every request, so this is safe to ignore there.
        }
      },
    },
  });
}

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildSignInPath } from "./redirects";

// getClaims() verifies the access token's signature, unlike getSession(),
// which trusts whatever the cookie contains.
export async function getVerifiedUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims?.sub) {
    return { supabase, user: null };
  }

  return {
    supabase,
    user: {
      id: claims.sub,
      email: typeof claims.email === "string" ? claims.email : null,
    },
  };
}

export async function requireVerifiedUser(currentPath: string) {
  const { supabase, user } = await getVerifiedUser();
  if (!user) {
    redirect(buildSignInPath(currentPath));
  }
  return { supabase, user };
}

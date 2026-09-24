import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signInPath } from "./redirects";

// getClaims() verifies the token's signature. getSession() would trust
// whatever the cookie says, so it's never used for access decisions.
export async function getUser() {
  const supabase = await createClient();
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

export async function requireUser(currentPath: string) {
  const { supabase, user } = await getUser();
  if (!user) {
    redirect(signInPath(currentPath));
  }
  return { supabase, user };
}

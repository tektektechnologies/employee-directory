import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isProtectedPath, signInPath } from "@/lib/auth/redirects";
import { getSupabaseEnv } from "./config";

const CACHE_HEADERS = ["cache-control", "expires", "pragma"];

export async function updateSession(request: NextRequest) {
  const { url, key } = getSupabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  // Refreshes an expiring token and verifies its signature. Must run before
  // any response is returned.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  const { pathname, search } = request.nextUrl;
  if (signedIn || !isProtectedPath(pathname)) {
    return response;
  }

  const redirect = NextResponse.redirect(new URL(signInPath(pathname + search), request.url));
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  for (const name of CACHE_HEADERS) {
    const value = response.headers.get(name);
    if (value) redirect.headers.set(name, value);
  }
  return redirect;
}

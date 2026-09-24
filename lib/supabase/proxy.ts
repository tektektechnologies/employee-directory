import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { buildSignInPath, isProtectedPath } from "@/lib/auth/redirects";
import { getSupabaseConfig } from "./config";

const CACHE_HEADER_NAMES = ["cache-control", "expires", "pragma"];

export async function refreshSessionAndGuardRoutes(request: NextRequest) {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseConfig();
  let sessionResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, cacheHeaders) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        sessionResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          sessionResponse.cookies.set(name, value, options),
        );
        Object.entries(cacheHeaders).forEach(([headerName, headerValue]) =>
          sessionResponse.headers.set(headerName, headerValue),
        );
      },
    },
  });

  // Must run before any response is returned: it refreshes an expiring token
  // and verifies the token's signature.
  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims?.sub);

  const { pathname, search } = request.nextUrl;
  if (isSignedIn || !isProtectedPath(pathname)) {
    return sessionResponse;
  }

  const redirectResponse = NextResponse.redirect(
    new URL(buildSignInPath(`${pathname}${search}`), request.url),
  );
  sessionResponse.cookies
    .getAll()
    .forEach((sessionCookie) => redirectResponse.cookies.set(sessionCookie));
  for (const headerName of CACHE_HEADER_NAMES) {
    const headerValue = sessionResponse.headers.get(headerName);
    if (headerValue) redirectResponse.headers.set(headerName, headerValue);
  }
  return redirectResponse;
}

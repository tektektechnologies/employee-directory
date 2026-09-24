import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { getSafeRedirectPath } from "@/lib/auth/redirects";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Handles both email link formats: token_hash (works on any device; needs the
// email template change in docs/auth.md) and code (Supabase's default PKCE
// link; only works in the browser that submitted the registration).
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const otpType = searchParams.get("type") as EmailOtpType | null;
  const authCode = searchParams.get("code");
  const redirectPath = getSafeRedirectPath(searchParams.get("next"));

  const supabase = await createSupabaseServerClient();
  let isVerified = false;

  if (tokenHash && otpType) {
    const { error } = await supabase.auth.verifyOtp({ type: otpType, token_hash: tokenHash });
    isVerified = !error;
  } else if (authCode) {
    const { error } = await supabase.auth.exchangeCodeForSession(authCode);
    isVerified = !error;
  }

  if (isVerified) {
    redirect(redirectPath);
  }

  redirect(`/sign-in?error=confirmation_failed&next=${encodeURIComponent(redirectPath)}`);
}

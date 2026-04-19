import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handlePostLogin } from "@/lib/auth/post-login";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Handles email confirmation (signup, invite, recovery, email_change).
 * Uses token_hash + type instead of PKCE code — works across browsers/devices.
 *
 * Email template must link to: {SITE_URL}/auth/confirm?token_hash={{.TokenHash}}&type=signup
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/login?error=missing_token`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  if (error) {
    console.error("[auth/confirm] verifyOtp error:", error.message);
    return NextResponse.redirect(`${origin}/login?error=confirm_failed`);
  }

  // Get verified user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=no_user`);
  }

  // Run post-login flow (role assignment, email matching, artist creation)
  const adminClient = createAdminClient();
  const { redirectTo } = await handlePostLogin(supabase, adminClient, user);

  return NextResponse.redirect(`${origin}${redirectTo}`);
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handlePostLogin } from "@/lib/auth/post-login";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token = searchParams.get("token");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth_cancelled`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=oauth_exchange_failed`);
  }

  // Get authenticated user after session exchange
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=no_user`);
  }

  // Post-login: role assignment, email matching, invitation token handling
  const adminClient = createAdminClient();
  const { redirectTo } = await handlePostLogin(
    supabase,
    adminClient,
    user,
    token
  );

  // Handle load balancers (Vercel, Railway)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocal = process.env.NODE_ENV === "development";

  if (isLocal) {
    return NextResponse.redirect(`${origin}${redirectTo}`);
  } else if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${redirectTo}`);
  }

  return NextResponse.redirect(`${origin}${redirectTo}`);
}

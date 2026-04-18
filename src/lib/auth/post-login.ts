import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Checks if the given email matches the configured ADMIN_EMAIL env var.
 * Comparison is case-insensitive (LOWER on both sides).
 */
export function isAdminEmail(email: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !email) return false;
  return email.toLowerCase() === adminEmail.toLowerCase();
}

/**
 * Orchestrates all post-login logic after OAuth code exchange:
 *
 * 1. Admin email check → sets role='admin' in profiles
 * 2. Artist email matching → links auth user to existing artist record
 * 3. New users → creates empty artist record with defaults
 * 4. Invitation token handling → validates, associates artist, marks used
 * 5. Role-based redirect: admin → /admin, artist → /artista
 *
 * Uses adminClient (service role) for all DB mutations to bypass RLS.
 */
export async function handlePostLogin(
  _supabase: SupabaseClient,
  adminClient: SupabaseClient,
  user: User,
  token?: string | null
): Promise<{ redirectTo: string }> {
  const email = user.email;

  if (!email) {
    return { redirectTo: "/login?error=no_email" };
  }

  // Step 0: Ensure profile exists (handles users created before trigger was set up)
  await adminClient.from("profiles").upsert(
    {
      id: user.id,
      role: isAdminEmail(email) ? "admin" : "artist",
      display_name:
        (user.user_metadata?.full_name as string | undefined) ??
        email.split("@")[0],
      avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
    },
    { onConflict: "id" }
  );

  // Step 1: Admin email check → ensure single admin, redirect
  if (isAdminEmail(email)) {
    // Downgrade any previous admins (only one admin allowed at a time)
    await adminClient
      .from("profiles")
      .update({ role: "artist" })
      .eq("role", "admin")
      .neq("id", user.id);

    return { redirectTo: "/admin" };
  }

  // Step 2: Match existing artist by email (case-insensitive via ilike)
  const { data: existingArtist } = await adminClient
    .from("artists")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (existingArtist) {
    // Link auth user to existing artist record
    await adminClient
      .from("artists")
      .update({ user_id: user.id })
      .eq("id", (existingArtist as { id: string }).id);
  } else {
    // Step 3: Create empty artist record for new users
    const displayName =
      (user.user_metadata?.full_name as string | undefined) ??
      email.split("@")[0];

    await adminClient.from("artists").insert({
      name: displayName,
      email: email.toLowerCase(),
      user_id: user.id,
      city: "",
      type: "Solista",
      genre: "Pop",
      phone: "",
      price: 0,
      duration: "",
      status: "Pendiente",
    });
  }

  // Step 4: Invitation token handling
  if (token) {
    const now = new Date().toISOString();

    // Validate token: not used and not expired
    const { data: invitation } = await adminClient
      .from("invitations")
      .select("token")
      .eq("token", token)
      .is("used_at", null)
      .gt("expires_at", now)
      .maybeSingle();

    if (invitation) {
      // Find artist created via this invitation token
      const { data: invitedArtist } = await adminClient
        .from("artists")
        .select("id")
        .eq("invitation_token", token)
        .maybeSingle();

      if (invitedArtist) {
        await adminClient
          .from("artists")
          .update({ user_id: user.id })
          .eq("id", (invitedArtist as { id: string }).id);
      }

      // Mark invitation as used
      await adminClient
        .from("invitations")
        .update({ used_at: now })
        .eq("token", token);
    }
  }

  // Step 5: Non-admin users → artist dashboard
  return { redirectTo: "/artista" };
}

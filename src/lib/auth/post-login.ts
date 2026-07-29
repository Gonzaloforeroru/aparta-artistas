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
  const adminEmailConfigured = !!process.env.ADMIN_EMAIL;
  const isAdmin = isAdminEmail(email);

  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    email.split("@")[0];
  const avatarUrl =
    (user.user_metadata?.avatar_url as string | undefined) ?? null;

  if (existingProfile) {
    // Profile exists — only change role if ADMIN_EMAIL env var is configured.
    // Without it we can't determine roles, so preserve whatever role is stored.
    const updatedRole = adminEmailConfigured
      ? (isAdmin ? "admin" : "artist")
      : existingProfile.role;

    await adminClient
      .from("profiles")
      .update({ role: updatedRole, display_name: displayName, avatar_url: avatarUrl })
      .eq("id", user.id);
  } else {
    // New user — create profile
    await adminClient.from("profiles").insert({
      id: user.id,
      role: isAdmin ? "admin" : "artist",
      display_name: displayName,
      avatar_url: avatarUrl,
    });
  }

  // Step 1: Admin email check → ensure single admin, redirect
  if (isAdmin) {
    // Downgrade any previous admins (only one admin allowed at a time)
    await adminClient
      .from("profiles")
      .update({ role: "artist" })
      .eq("role", "admin")
      .neq("id", user.id);

    return { redirectTo: "/admin" };
  }

  // If ADMIN_EMAIL not configured but user already has admin role, respect it
  if (!adminEmailConfigured && existingProfile?.role === "admin") {
    return { redirectTo: "/admin" };
  }

  // Step 2: Find or create artist record by email (case-insensitive)
  const normalizedEmail = email.toLowerCase();
  const { data: existingArtist } = await adminClient
    .from("artists")
    .select("id")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (existingArtist) {
    // Link auth user to existing artist record
    await adminClient
      .from("artists")
      .update({ user_id: user.id })
      .eq("id", (existingArtist as { id: string }).id);
  } else {
    // Step 3: Create artist record — use upsert to prevent duplicate email errors
    const displayName =
      (user.user_metadata?.full_name as string | undefined) ??
      email.split("@")[0];

    const { error: artistError } = await adminClient.from("artists").upsert(
      {
        name: displayName,
        email: normalizedEmail,
        user_id: user.id,
        city: "",
        type: "Solista",
        genre: "Pop",
        phone: "",
        price: 0,
        duration: "",
        status: "Pendiente",
      },
      { onConflict: "email", ignoreDuplicates: true }
    );

    // If upsert failed (e.g. constraint violation), try linking by user_id
    if (artistError) {
      console.error("[handlePostLogin] artist upsert error:", artistError.message);
      // Attempt to link existing record by email as fallback
      await adminClient
        .from("artists")
        .update({ user_id: user.id })
        .ilike("email", normalizedEmail);
    }
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

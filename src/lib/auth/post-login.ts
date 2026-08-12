import type { SupabaseClient, User } from "@supabase/supabase-js";
import { buildNewArtistRow } from "@/lib/auth/ensure-artist";

/**
 * Checks if the given email matches the configured ADMIN_EMAIL env var.
 * Comparison is case-insensitive (LOWER on both sides).
 */
export function isAdminEmail(email: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (!adminEmail || !email) return false;
  return email.trim().toLowerCase() === adminEmail.toLowerCase();
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
  supabase: SupabaseClient,
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

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    email.split("@")[0];
  const avatarUrl =
    (user.user_metadata?.avatar_url as string | undefined) ?? null;

  // A single upsert covers both "profile missing" and "profile exists".
  // `role` is only written when ADMIN_EMAIL is configured: without it we cannot
  // tell admins from artists, and an upsert that omits the column leaves the
  // stored role untouched (new rows fall back to the column default 'artist').
  await adminClient.from("profiles").upsert(
    {
      id: user.id,
      display_name: displayName,
      avatar_url: avatarUrl,
      ...(adminEmailConfigured ? { role: isAdmin ? "admin" : "artist" } : {}),
    },
    { onConflict: "id" }
  );

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

  // If ADMIN_EMAIL is not configured we cannot detect admins by email, so fall
  // back to the role already stored in the profile. Read through the
  // user-scoped client (RLS policy `select_own_profile`) to keep the
  // service-role round trips down to one for the profile step.
  if (!adminEmailConfigured) {
    try {
      const { data: storedProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if ((storedProfile as { role?: string } | null)?.role === "admin") {
        return { redirectTo: "/admin" };
      }
    } catch (error) {
      console.error(
        "[handlePostLogin] could not read stored role:",
        error instanceof Error ? error.message : error
      );
    }
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
    // Step 3: Create the artist record.
    //
    // This used to be an upsert with `{ onConflict: "email" }`. The only unique
    // index on the column is `idx_artists_email`, declared on the EXPRESSION
    // `lower(email)`, and Postgres will not match `ON CONFLICT (email)` against
    // an expression index — every call died with 42P10 ("no unique or exclusion
    // constraint matching the ON CONFLICT specification"). The row was never
    // created and the user ended up with a valid session and no profile: the
    // /artista ↔ /login redirect loop.
    // A plain insert is safe here — the ilike lookup above already ruled out a
    // record with this email.
    const { error: artistError } = await adminClient
      .from("artists")
      .insert(buildNewArtistRow(user));

    // If the insert failed, fall back to claiming a record with the same email
    if (artistError) {
      console.error("[handlePostLogin] artist insert error:", artistError.message);
      await adminClient
        .from("artists")
        .update({ user_id: user.id })
        .ilike("email", normalizedEmail);
    }
  }

  // Step 4: Invitation token handling
  //
  // Uses `redeem_invitation` RPC for atomic consumption: it validates, increments
  // uses_count, and returns association_id in a single transaction. This avoids
  // race conditions on multi-use (campaign) tokens.
  //
  // The adminClient (service role) calls the RPC so it works even if the user's
  // role has no direct access to the invitations table.
  if (token) {
    // AQUI NO SE CANJEA.
    //
    // El canje ya lo hizo registerArtistWithToken al crear la ficha, y ahi se
    // asigno tambien la association_id. Volver a llamar a redeem_invitation
    // gastaria un SEGUNDO uso por la misma persona: una campana con cupo 10
    // solo habria servido a 5. Lo unico que falta aqui es enlazar la ficha
    // (creada sin sesion) con la cuenta que acaba de entrar.
    //
    // Tampoco se puede usar maybeSingle() filtrando solo por el token: en una
    // campana MUCHAS fichas comparten el mismo invitation_token, y en cuanto
    // hubiera dos la consulta reventaba. Se acota a las que aun no tienen
    // dueno y se toma la mas reciente.
    const { data: candidatos } = await adminClient
      .from("artists")
      .select("id")
      .eq("invitation_token", token)
      .is("user_id", null)
      .order("created_at", { ascending: false })
      .limit(1);

    const invitedArtist = candidatos?.[0];

    if (invitedArtist) {
      await adminClient
        .from("artists")
        .update({ user_id: user.id })
        .eq("id", invitedArtist.id);
    }
  }

  // Step 5: Non-admin users → artist dashboard
  return { redirectTo: "/artista" };
}

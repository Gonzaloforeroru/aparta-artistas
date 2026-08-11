import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables, TablesInsert } from "@/lib/supabase/database.types";

type Artist = Tables<"artists">;

/**
 * Default column values for a freshly created artist record.
 *
 * Single source of truth so that `handlePostLogin` (happy path) and
 * `ensureArtistProfile` (self-heal path) always produce identical rows.
 *
 * `type` / `genre` still carry enum defaults because `artists.type` and
 * `artists.genre` are NOT NULL enums today. They are placeholders: the real
 * values live in `artist_tags` and the user overwrites them in
 * `/artista/completar`. `isProfileComplete()` keeps the profile "incomplete"
 * until city, phone, duration and price are filled in.
 */
export function buildNewArtistRow(user: User): TablesInsert<"artists"> {
  const email = (user.email ?? "").toLowerCase();
  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    email.split("@")[0];

  return {
    name,
    email,
    user_id: user.id,
    city: "",
    type: "Solista",
    genre: "Pop",
    phone: "",
    price: 0,
    duration: "",
    status: "Pendiente",
  };
}

/**
 * Guarantees the current authenticated user owns a row in `artists`.
 *
 * This is the recovery path for sessions that never went through
 * `handlePostLogin` successfully (legacy accounts, failed email confirmation,
 * a post-login insert that errored). Without it the user holds a valid session
 * with no artist record, which used to bounce `/artista → /login → /artista`
 * forever.
 *
 * Order of resolution:
 *   1. Row already linked by `user_id` → return it.
 *   2. Orphan row with the same email (created by the admin, never claimed)
 *      → link it to this user.
 *   3. Nothing → insert a fresh row with defaults.
 *
 * Uses the service-role client because the user cannot INSERT into `artists`
 * under RLS. Returns `null` only if the write genuinely failed — callers must
 * surface an error instead of redirecting.
 */
export async function ensureArtistProfile(): Promise<Artist | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const adminClient = createAdminClient();
  const normalizedEmail = user.email.toLowerCase();

  // 1. Already owns a record
  const { data: owned } = await adminClient
    .from("artists")
    .select("*")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (owned) return owned as Artist;

  // 2. Unclaimed record with the same email (admin-created / imported)
  const { data: orphan } = await adminClient
    .from("artists")
    .select("id")
    .ilike("email", normalizedEmail)
    .is("user_id", null)
    .limit(1)
    .maybeSingle();

  if (orphan) {
    const { data: linked, error: linkError } = await adminClient
      .from("artists")
      .update({ user_id: user.id })
      .eq("id", (orphan as { id: string }).id)
      .select("*")
      .single();

    if (!linkError && linked) return linked as Artist;
    console.error(
      "[ensureArtistProfile] failed to link orphan artist:",
      linkError?.message
    );
  }

  // 3. Create from scratch
  const { data: created, error: insertError } = await adminClient
    .from("artists")
    .insert(buildNewArtistRow(user))
    .select("*")
    .single();

  if (!insertError) return created as Artist;

  // The insert can legitimately lose a race: in the App Router a layout and its
  // page render in parallel, so both can call this helper at the same time.
  // `idx_artists_user_id` (unique on user_id where not null) makes the loser
  // fail with 23505 instead of creating a duplicate — re-read and use the
  // winner's row. `idx_artists_email` (unique on lower(email)) can also reject
  // the insert if another account already owns this email.
  console.error(
    "[ensureArtistProfile] insert failed, re-reading:",
    insertError.message
  );

  const { data: recovered } = await adminClient
    .from("artists")
    .select("*")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  return (recovered as Artist | null) ?? null;
}

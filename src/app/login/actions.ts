"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handlePostLogin } from "@/lib/auth/post-login";

export async function signInWithGoogle(token?: string) {
  const supabase = await createClient();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL || "https://aparta-artistas.vercel.app";

  let redirectTo = `${origin}/auth/callback`;
  if (token) {
    redirectTo += `?token=${encodeURIComponent(token)}`;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error || !data.url) {
    redirect("/login?error=oauth_failed");
  }

  redirect(data.url);
}

export async function signInWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const token = (formData.get("token") as string) || null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const params = new URLSearchParams({ error: "invalid_credentials" });
    if (token) params.set("token", token);
    redirect(`/login?${params.toString()}`);
  }

  const adminClient = createAdminClient();
  const { redirectTo } = await handlePostLogin(
    supabase,
    adminClient,
    data.user,
    token
  );

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function signUpWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  const supabase = await createClient();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL || "https://aparta-artistas.vercel.app";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("[signUpWithEmail] Error:", error.message, error.status);
    const errorType =
      error.message?.includes("already registered")
        ? "already_registered"
        : error.message?.includes("password")
          ? "weak_password"
          : "signup_failed";
    redirect(`/registro?error=${errorType}`);
  }

  // Supabase returns user with empty identities if email already exists (security measure)
  if (data.user && data.user.identities?.length === 0) {
    redirect("/registro?error=already_registered");
  }

  // If auto-confirmed (session exists), run post-login flow immediately
  if (data.user && data.session) {
    const adminClient = createAdminClient();
    await handlePostLogin(supabase, adminClient, data.user);
    revalidatePath("/", "layout");
    redirect("/artista");
  }

  // Email confirmation required — redirect to success page
  redirect("/registro/exito");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

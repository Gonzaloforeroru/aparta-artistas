"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handlePostLogin } from "@/lib/auth/post-login";

export async function signInWithGoogle(token?: string) {
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL!;

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
    const message = error.message?.includes("Email not confirmed")
      ? "Debes confirmar tu correo electrónico antes de iniciar sesión."
      : "Correo o contraseña incorrectos.";
    return { error: message };
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
  /*
    El token de invitacion tiene que sobrevivir al alta.

    Quien llega por un enlace de campana casi nunca tiene cuenta: pasa por aqui
    antes que por el login. Si el token se pierde en este paso, handlePostLogin
    no puede canjear la invitacion y el artista se queda SIN la insignia de la
    asociacion, que es justo el motivo de existir del enlace.

    Va tanto a handlePostLogin (alta con sesion inmediata) como al
    emailRedirectTo (alta que requiere confirmar el correo: el token viaja en
    el enlace del email y vuelve por /auth/callback).
  */
  const token = (formData.get("token") as string) || null;

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL!;

  const callbackUrl = token
    ? `${origin}/auth/callback?token=${encodeURIComponent(token)}`
    : `${origin}/auth/callback`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: callbackUrl,
    },
  });

  if (error) {
    console.error("[signUpWithEmail] Supabase error:", error.message);
    const message = error.message?.includes("already registered")
      ? "Este correo ya está registrado. Intenta iniciar sesión."
      : error.message?.includes("password")
        ? "La contraseña debe tener al menos 6 caracteres."
        : `Error: ${error.message}`;
    return { error: message };
  }

  // Supabase returns user with empty identities if email already exists (security measure)
  if (data.user && data.user.identities?.length === 0) {
    return { error: "Este correo ya está registrado. Intenta iniciar sesión." };
  }

  // If auto-confirmed (session exists), run post-login flow immediately
  if (data.user && data.session) {
    const adminClient = createAdminClient();
    const { redirectTo } = await handlePostLogin(
      supabase,
      adminClient,
      data.user,
      token,
    );
    revalidatePath("/", "layout");
    redirect(redirectTo);
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

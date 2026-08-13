import { redirect } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { MusicNote02Icon } from "@hugeicons/core-free-icons";
import { RegistroEmailForm } from "@/app/registro/registro-email-form";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const errorMessages: Record<string, string> = {
  signup_failed: "Error al crear la cuenta. Intenta de nuevo.",
  already_registered: "Este correo ya está registrado. Intenta iniciar sesión.",
  weak_password: "La contraseña debe tener al menos 6 caracteres.",
};

interface RegistroPageProps {
  searchParams: Promise<{ error?: string; token?: string }>;
}

export default async function RegistroPage({
  searchParams,
}: RegistroPageProps) {
  // If already logged in, redirect
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "admin") redirect("/admin");
    redirect("/artista");
  }

  const params = await searchParams;
  const error = params.error;
  const token = params.token;

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-8">
      {/* Gradient blobs */}
      <div className="pointer-events-none absolute inset-0 h-full w-full">
        <div className="absolute -top-[300px] -left-[200px] h-[800px] w-[800px] rounded-full bg-[#6E2FE3] opacity-20 blur-[150px]" />
        <div className="absolute top-[40%] right-[-100px] h-[600px] w-[600px] rounded-full bg-[#F31A7C] opacity-15 blur-[140px]" />
        <div className="absolute bottom-[10%] left-[20%] h-[500px] w-[500px] rounded-full bg-[#0CABF7] opacity-10 blur-[130px]" />
      </div>

      {/* Card */}
      <div className="glass-card relative z-10 flex w-full max-w-sm flex-col gap-6 rounded-[20px] p-8">
        {/* Branding */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <HugeiconsIcon icon={MusicNote02Icon} className="size-6" />
          </div>
          <div className="text-center">
            <h1 className="font-heading text-2xl font-semibold text-foreground">
              Apparta
            </h1>
            <p className="mt-1 text-sm text-[var(--text-tertiary)]">
              Crear cuenta
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && errorMessages[error] && (
          <div className="rounded-lg bg-[var(--error-bg)] px-4 py-3 text-sm text-[var(--error)]">
            {errorMessages[error]}
          </div>
        )}

        {/* Email/password signup form */}
          <RegistroEmailForm token={token} />

        {/* Login link */}
        <p className="text-center text-sm text-[var(--text-tertiary)]">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

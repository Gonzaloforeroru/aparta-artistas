import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { MusicNote02Icon } from "@hugeicons/core-free-icons";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import Link from "next/link";

interface LoginPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
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
              Inicia sesión con tu cuenta de Google para continuar
            </p>
          </div>
        </div>

        {/* Google sign in */}
        <GoogleSignInButton token={token} />

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--border-subtle)]" />
          <span className="text-[11px] uppercase text-[var(--text-muted)]">
            o explora
          </span>
          <div className="h-px flex-1 bg-[var(--border-subtle)]" />
        </div>

        {/* Explore link */}
        <Link href="/catalogo">
          <Button variant="outline" className="h-10 w-full">
            Ver catálogo de artistas
          </Button>
        </Link>


      </div>
    </div>
  );
}

import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ErrorPage() {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-8">
      <div className="pointer-events-none absolute inset-0 h-full w-full">
        <div className="absolute -top-[300px] -left-[200px] h-[800px] w-[800px] rounded-full bg-[#6E2FE3] opacity-20 blur-[150px]" />
        <div className="absolute top-[40%] right-[-100px] h-[600px] w-[600px] rounded-full bg-[#F31A7C] opacity-15 blur-[140px]" />
        <div className="absolute bottom-[10%] left-[20%] h-[500px] w-[500px] rounded-full bg-[#0CABF7] opacity-10 blur-[130px]" />
      </div>

      <div className="glass-card relative z-10 flex w-full max-w-sm flex-col items-center gap-6 rounded-[20px] p-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-[var(--error-bg)]">
          <HugeiconsIcon icon={AlertCircleIcon} className="size-8 text-[var(--error)]" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-xl font-semibold text-foreground">Algo salió mal</h1>
          <p className="text-sm text-[var(--text-tertiary)]">
            Ocurrió un error inesperado. Intenta de nuevo o contacta al administrador.
          </p>
        </div>
        <Link href="/">
          <Button>Volver al inicio</Button>
        </Link>
      </div>
    </div>
  );
}

import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon, MusicNote02Icon } from "@hugeicons/core-free-icons";

export default function RegistroExitoPage() {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-8">
      <div className="pointer-events-none absolute inset-0 h-full w-full">
        <div className="absolute -top-[300px] -left-[200px] h-[800px] w-[800px] rounded-full bg-[#6E2FE3] opacity-20 blur-[150px]" />
        <div className="absolute top-[40%] right-[-100px] h-[600px] w-[600px] rounded-full bg-[#F31A7C] opacity-15 blur-[140px]" />
        <div className="absolute bottom-[10%] left-[20%] h-[500px] w-[500px] rounded-full bg-[#0CABF7] opacity-10 blur-[130px]" />
      </div>

      <div className="glass-card relative z-10 flex w-full max-w-sm flex-col items-center gap-6 rounded-[20px] p-8 text-center">
        <div className="relative">
          <div className="flex size-20 items-center justify-center rounded-full bg-[var(--success-bg)]">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-10 text-[var(--success)]" />
          </div>
          <div className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <HugeiconsIcon icon={MusicNote02Icon} className="size-4" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            ¡Solicitud Enviada!
          </h1>
          <p className="text-sm text-[var(--text-tertiary)] leading-relaxed">
            Tu perfil ha sido recibido y está en revisión.
            Un administrador lo revisará pronto.
          </p>
        </div>

        <div className="w-full rounded-2xl bg-[var(--elevated)] p-4">
          <p className="text-xs text-[var(--text-muted)]">
            Cuando tu perfil sea aprobado, aparecerás en el catálogo de artistas
            y los restaurantes podrán contactarte directamente.
          </p>
        </div>
      </div>
    </div>
  );
}

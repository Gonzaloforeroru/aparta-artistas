import { CheckCircle, Music2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function RegistroExitoPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardContent className="flex flex-col items-center gap-6 p-10 text-center">
          <div className="relative">
            <div className="flex size-20 items-center justify-center rounded-full bg-[var(--success-bg)]">
              <CheckCircle className="size-10 text-[var(--success)]" />
            </div>
            <div className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Music2 className="size-4" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              ¡Solicitud Enviada!
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tu perfil ha sido recibido y está en revisión.
              Un administrador lo revisará pronto.
            </p>
          </div>

          <div className="w-full rounded-lg bg-muted/50 p-4">
            <p className="text-xs text-muted-foreground">
              Cuando tu perfil sea aprobado, aparecerás en el catálogo de artistas
              y los restaurantes podrán contactarte directamente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

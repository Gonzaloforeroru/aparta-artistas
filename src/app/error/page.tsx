import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardContent className="flex flex-col items-center gap-6 p-10 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-[var(--error-bg)]">
            <AlertCircle className="size-8 text-[var(--error)]" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-bold text-foreground">Algo salió mal</h1>
            <p className="text-sm text-muted-foreground">
              Ocurrió un error inesperado. Intenta de nuevo o contacta al administrador.
            </p>
          </div>
          <Button asChild>
            <Link href="/">Volver al inicio</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

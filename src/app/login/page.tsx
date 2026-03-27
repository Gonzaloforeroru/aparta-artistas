"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-[420px] shadow-lg border-0">
        <CardContent className="flex flex-col gap-6 p-10">
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Apparta
            </h1>
            <p className="text-sm text-muted-foreground">Módulo de Artistas</p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                className="h-12"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-12"
              />
            </div>

            <Button 
              onClick={() => router.push("/admin")}
              className="h-12 w-full text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Iniciar Sesión
            </Button>
          </div>

          <div className="relative flex items-center gap-4">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">o</span>
            <Separator className="flex-1" />
          </div>

          <div className="flex items-center justify-center gap-1.5 text-sm">
            <span className="text-muted-foreground">¿Eres artista?</span>
            <Link
              href="/registro"
              className="font-semibold text-primary hover:text-primary/80 underline underline-offset-2"
            >
              Regístrate aquí
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

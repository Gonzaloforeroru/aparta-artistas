"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ShieldCheck, Users, Music2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-[860px] flex-col gap-6 lg:flex-row lg:gap-0">

        <Card className="flex-1 shadow-lg border-0 lg:rounded-r-none">
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

        <Card className="flex-1 shadow-lg border-0 bg-muted/50 lg:rounded-l-none lg:border-l">
          <CardContent className="flex flex-col gap-5 p-10">
            <div>
              <Badge variant="outline" className="mb-2 text-xs font-medium">Guía de la maqueta</Badge>
              <h2 className="text-lg font-semibold tracking-tight">¿Cómo navegar?</h2>
              <p className="text-xs text-muted-foreground">Esta app tiene 3 vistas según el rol</p>
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => router.push("/admin")}
                className="flex items-start gap-3 rounded-lg border bg-background p-4 text-left transition-all hover:shadow-md hover:border-primary/30 cursor-pointer"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <ShieldCheck className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">Admin</p>
                    <ArrowRight className="size-3 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Dashboard, métricas, editar y eliminar artistas, aprobar registros
                  </p>
                </div>
              </button>

              <button
                onClick={() => window.open("/catalogo", "_blank")}
                className="flex items-start gap-3 rounded-lg border bg-background p-4 text-left transition-all hover:shadow-md hover:border-primary/30 cursor-pointer"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-chart-2 text-white">
                  <Users className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">Restaurante / Público</p>
                    <ArrowRight className="size-3 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Catálogo de artistas con filtros, contacto por WhatsApp
                  </p>
                </div>
              </button>

              <button
                onClick={() => window.open("/registro", "_blank")}
                className="flex items-start gap-3 rounded-lg border bg-background p-4 text-left transition-all hover:shadow-md hover:border-primary/30 cursor-pointer"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-chart-4 text-white">
                  <Music2 className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">Artista</p>
                    <ArrowRight className="size-3 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Formulario de registro con datos, precios y redes sociales
                  </p>
                </div>
              </button>
            </div>

            <p className="text-[10px] text-muted-foreground text-center mt-auto">
              Solo haz clic en cualquier tarjeta para explorar cada vista
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

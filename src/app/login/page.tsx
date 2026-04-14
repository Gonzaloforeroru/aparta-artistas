import { Card, CardContent } from "@/components/ui/card";
import { Music2 } from "lucide-react";
import { GoogleSignInButton } from "@/components/google-sign-in-button";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/10 px-4">
      <Card className="w-full max-w-sm border-0 shadow-xl">
        <CardContent className="flex flex-col gap-8 p-10">
          {/* Branding */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <Music2 className="size-7" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Apparta
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Panel de Administración
              </p>
            </div>
          </div>

          {/* Google sign in */}
          <div className="flex flex-col gap-3">
            <GoogleSignInButton />
            <p className="text-center text-xs text-muted-foreground">
              Acceso exclusivo para administradores
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

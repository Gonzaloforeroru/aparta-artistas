"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { signUpWithEmail } from "@/app/login/actions";

export function RegistroEmailForm() {
  const [isPending, startTransition] = useTransition();
  const [localError, setLocalError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setLocalError(null);

    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setLocalError("Las contraseñas no coinciden");
      return;
    }

    startTransition(async () => {
      const result = await signUpWithEmail(formData);
      if (result?.error) {
        setLocalError(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      {localError && (
        <div className="rounded-lg bg-[var(--error-bg)] px-4 py-3 text-sm text-[var(--error)]">
          {localError}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nombre completo</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Tu nombre completo"
          required
          className="h-11"
          autoComplete="name"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="signup-email">Correo electrónico</Label>
        <Input
          id="signup-email"
          name="email"
          type="email"
          placeholder="tu@correo.com"
          required
          className="h-11"
          autoComplete="email"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="signup-password">Contraseña</Label>
        <Input
          id="signup-password"
          name="password"
          type="password"
          placeholder="Mínimo 6 caracteres"
          required
          minLength={6}
          className="h-11"
          autoComplete="new-password"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm-password">Confirmar contraseña</Label>
        <Input
          id="confirm-password"
          name="confirmPassword"
          type="password"
          placeholder="Repite tu contraseña"
          required
          minLength={6}
          className="h-11"
          autoComplete="new-password"
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="h-11 w-full font-medium"
      >
        {isPending ? "Creando cuenta..." : "Crear cuenta"}
      </Button>
    </form>
  );
}

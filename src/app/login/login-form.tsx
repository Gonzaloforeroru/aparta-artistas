"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { signInWithEmail } from "@/app/login/actions";

interface LoginFormProps {
  token?: string;
}

export function LoginForm({ token }: LoginFormProps) {
  const [isPending, startTransition] = useTransition();
  const [localError, setLocalError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setLocalError(null);
    startTransition(async () => {
      const result = await signInWithEmail(formData);
      if (result?.error) {
        setLocalError(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      {token && <input type="hidden" name="token" value={token} />}

      {localError && (
        <div className="rounded-lg bg-[var(--error-bg)] px-4 py-3 text-sm text-[var(--error)]">
          {localError}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="tu@correo.com"
          required
          className="h-11"
          autoComplete="email"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Contraseña"
          required
          minLength={6}
          className="h-11"
          autoComplete="current-password"
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="h-11 w-full font-medium"
      >
        {isPending ? "Iniciando sesión..." : "Iniciar sesión"}
      </Button>
    </form>
  );
}

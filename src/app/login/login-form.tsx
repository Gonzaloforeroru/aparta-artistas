"use client";

import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { signInWithEmail } from "@/app/login/actions";

interface LoginFormProps {
  token?: string;
}

export function LoginForm({ token }: LoginFormProps) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await signInWithEmail(formData);
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      {token && <input type="hidden" name="token" value={token} />}

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

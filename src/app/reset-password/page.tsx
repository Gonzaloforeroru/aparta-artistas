"use client"

import { useEffect, useState, type FormEvent } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

type Status = "loading" | "ready" | "invalid"

/**
 * Página de restablecimiento de contraseña (flujo "olvidé mi contraseña").
 *
 * El correo de recuperación de Supabase debe enlazar aquí:
 *   {SITE_URL}/reset-password?token_hash={{ .TokenHash }}&type=recovery
 *
 * Al cargar, canjea el token_hash con verifyOtp para abrir una sesión de
 * recuperación y así permitir updateUser({ password }) sin pedir la contraseña
 * anterior (que el usuario no recuerda). No usa las rutas protegidas
 * /admin ni /artista, por lo que el proxy no la bloquea.
 */
export default function ResetPasswordPage() {
  const supabase = createClient()
  const [status, setStatus] = useState<Status>("loading")
  const [isPending, setIsPending] = useState(false)
  const [message, setMessage] = useState<{
    type: "error" | "success"
    text: string
  } | null>(null)

  useEffect(() => {
    async function init() {
      const params = new URLSearchParams(window.location.search)
      const tokenHash = params.get("token_hash")
      const type = params.get("type")

      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as "recovery",
        })
        if (!error) {
          // Quita el token de la barra de direcciones una vez canjeado.
          window.history.replaceState({}, "", "/reset-password")
          setStatus("ready")
          return
        }
      }

      // Respaldo: si ya hay una sesión activa, permite igualmente el cambio.
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setStatus(user ? "ready" : "invalid")
    }

    init()
  }, [supabase])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage(null)

    const data = new FormData(e.currentTarget)
    const newPassword = data.get("newPassword") as string
    const confirmPassword = data.get("confirmPassword") as string

    if (!newPassword || newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "La contraseña debe tener al menos 6 caracteres.",
      })
      return
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Las contraseñas no coinciden." })
      return
    }

    setIsPending(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setIsPending(false)

    if (error) {
      setMessage({
        type: "error",
        text: "No se pudo actualizar la contraseña. El enlace pudo expirar; solicita uno nuevo.",
      })
      return
    }

    setMessage({
      type: "success",
      text: "Contraseña actualizada. Redirigiendo...",
    })
    setTimeout(() => {
      window.location.href = "/admin"
    }, 1200)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <h1 className="text-center text-2xl font-bold tracking-tight">
          Restablecer contraseña
        </h1>

        {status === "loading" && (
          <p className="text-center text-sm text-muted-foreground">
            Verificando enlace...
          </p>
        )}

        {status === "invalid" && (
          <Card>
            <CardContent className="flex flex-col gap-4 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Este enlace de recuperación no es válido o ya expiró. Solicita
                uno nuevo desde la pantalla de inicio de sesión.
              </p>
              <Button
                className="h-11 font-semibold"
                onClick={() => {
                  window.location.href = "/login"
                }}
              >
                Volver a iniciar sesión
              </Button>
            </CardContent>
          </Card>
        )}

        {status === "ready" && (
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="confirmPassword">
                    Confirmar nueva contraseña
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    minLength={6}
                    required
                  />
                </div>

                {message && (
                  <p
                    className={`text-sm ${
                      message.type === "success"
                        ? "text-green-600"
                        : "text-destructive"
                    }`}
                  >
                    {message.text}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={isPending}
                  className="h-11 font-semibold"
                >
                  {isPending ? "Guardando..." : "Guardar contraseña"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

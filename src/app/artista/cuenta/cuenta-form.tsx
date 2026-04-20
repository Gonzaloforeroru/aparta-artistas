"use client"

import { useState, useTransition, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { updateEmail, updatePassword } from "@/app/artista/cuenta/actions"

interface CuentaFormProps {
  email: string
}

export function CuentaForm({ email }: CuentaFormProps) {
  // ─── Email form state ───
  const [emailPending, startEmailTransition] = useTransition()
  const [emailMessage, setEmailMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  // ─── Password form state ───
  const [passwordPending, startPasswordTransition] = useTransition()
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)
  const [matchError, setMatchError] = useState<string | null>(null)
  const passwordFormRef = useRef<HTMLFormElement>(null)

  function handleEmailSubmit(formData: FormData) {
    setEmailMessage(null)
    startEmailTransition(async () => {
      const result = await updateEmail(formData)
      if (result.error) {
        setEmailMessage({ type: "error", text: result.error })
      } else if (result.success) {
        setEmailMessage({ type: "success", text: result.success })
      }
    })
  }

  function handlePasswordSubmit(formData: FormData) {
    setPasswordMessage(null)
    setMatchError(null)

    const newPassword = formData.get("newPassword") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (newPassword !== confirmPassword) {
      setMatchError("Las contraseñas no coinciden.")
      return
    }

    startPasswordTransition(async () => {
      const result = await updatePassword(formData)
      if (result.error) {
        setPasswordMessage({ type: "error", text: result.error })
      } else if (result.success) {
        setPasswordMessage({ type: "success", text: result.success })
        passwordFormRef.current?.reset()
      }
    })
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      {/* ═══ Cambiar correo ═══ */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <p className="text-sm font-semibold">Cambiar correo electrónico</p>

          <form action={handleEmailSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="currentEmail">Correo actual</Label>
              <Input
                id="currentEmail"
                type="email"
                value={email}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Nuevo correo</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="nuevo@correo.com"
                required
              />
            </div>

            {emailMessage && (
              <p
                className={`text-sm ${emailMessage.type === "success" ? "text-green-600" : "text-destructive"}`}
              >
                {emailMessage.text}
              </p>
            )}

            <Button
              type="submit"
              disabled={emailPending}
              className="h-11 font-semibold"
            >
              {emailPending ? "Actualizando..." : "Actualizar correo"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* ═══ Cambiar contraseña ═══ */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <p className="text-sm font-semibold">Cambiar contraseña</p>

          <form
            ref={passwordFormRef}
            action={handlePasswordSubmit}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="currentPassword">Contraseña actual</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="newPassword">Nueva contraseña</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                minLength={6}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                minLength={6}
                required
              />
            </div>

            {matchError && (
              <p className="text-sm text-destructive">{matchError}</p>
            )}

            {passwordMessage && (
              <p
                className={`text-sm ${passwordMessage.type === "success" ? "text-green-600" : "text-destructive"}`}
              >
                {passwordMessage.text}
              </p>
            )}

            <Button
              type="submit"
              disabled={passwordPending}
              className="h-11 font-semibold"
            >
              {passwordPending ? "Actualizando..." : "Actualizar contraseña"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

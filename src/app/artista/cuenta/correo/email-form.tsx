"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { updateEmail } from "@/app/artista/cuenta/actions"

interface EmailFormProps {
  email: string
}

export function EmailForm({ email }: EmailFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  function handleSubmit(formData: FormData) {
    setMessage(null)
    startTransition(async () => {
      const result = await updateEmail(formData)
      if (result.error) {
        setMessage({ type: "error", text: result.error })
      } else if (result.success) {
        setMessage({ type: "success", text: result.success })
      }
    })
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6">
        <form action={handleSubmit} className="flex flex-col gap-4">
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

          {message && (
            <p
              className={`text-sm ${message.type === "success" ? "text-green-600" : "text-destructive"}`}
            >
              {message.text}
            </p>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 font-semibold"
              onClick={() => router.push("/artista")}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-11 flex-1 font-semibold"
            >
              {isPending ? "Actualizando..." : "Actualizar correo"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

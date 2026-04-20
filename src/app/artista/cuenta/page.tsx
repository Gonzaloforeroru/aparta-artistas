import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getAuthProvider } from "@/app/artista/cuenta/actions"
import { CuentaForm } from "@/app/artista/cuenta/cuenta-form"
import { Card, CardContent } from "@/components/ui/card"
import { HugeiconsIcon } from "@hugeicons/react"
import { InformationCircleIcon } from "@hugeicons/core-free-icons"

export default async function CuentaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const provider = await getAuthProvider()

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <h1 className="text-center text-2xl font-bold tracking-tight">
        Configuración de cuenta
      </h1>

      {provider === "google" ? (
        <Card>
          <CardContent className="flex items-start gap-3 p-6">
            <HugeiconsIcon
              icon={InformationCircleIcon}
              className="mt-0.5 size-5 shrink-0 text-muted-foreground"
            />
            <p className="text-sm text-muted-foreground">
              Tu cuenta usa Google. No puedes cambiar correo ni contraseña aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <CuentaForm email={user.email ?? ""} />
      )}
    </div>
  )
}

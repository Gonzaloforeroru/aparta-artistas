"use server"

import { createClient } from "@/lib/supabase/server"

type ActionResult =
  | { success: string; error?: never }
  | { error: string; success?: never }

export async function updateEmail(formData: FormData): Promise<ActionResult> {
  const newEmail = formData.get("email") as string
  if (!newEmail) return { error: "El correo es requerido." }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ email: newEmail })

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "Este correo ya está en uso." }
    }
    return { error: "Error al actualizar el correo." }
  }

  return { success: "Te enviamos un enlace de confirmación al nuevo correo." }
}

export async function updatePassword(formData: FormData): Promise<ActionResult> {
  const currentPassword = formData.get("currentPassword") as string
  const newPassword = formData.get("newPassword") as string

  if (!newPassword || newPassword.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." }
  }

  const supabase = await createClient()

  // Verify current password first by trying to sign in
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return { error: "No autenticado." }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })

  if (verifyError) {
    return { error: "La contraseña actual es incorrecta." }
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    return { error: "Error al actualizar la contraseña." }
  }

  return { success: "Contraseña actualizada correctamente." }
}

// Check if user signed up with email (not OAuth)
export async function getAuthProvider(): Promise<
  "email" | "google" | "unknown"
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return "unknown"

  const identities = user.identities ?? []
  if (identities.some((i) => i.provider === "google")) return "google"
  if (identities.some((i) => i.provider === "email")) return "email"
  return "unknown"
}

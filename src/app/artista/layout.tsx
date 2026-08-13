import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getMyArtistProfile } from "@/app/artista/actions"
import type { Artist } from "@/app/artista/actions"
import { ensureArtistProfile } from "@/lib/auth/ensure-artist"
import { signOut } from "@/app/login/actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HugeiconsIcon } from "@hugeicons/react"
import { Settings01Icon, Mail01Icon, LockPasswordIcon } from "@hugeicons/core-free-icons"

export default async function ArtistaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ─── 1. Auth check ───
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // ─── 2. Profile + role check ───
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name, avatar_url")
    .eq("id", user.id)
    .single()

  if (profile?.role === "admin") {
    redirect("/admin")
  }

  // ─── 3. Artist profile existence ───
  // NEVER redirect to /login from here. The session is valid, so /login sends
  // the user straight back to /artista and the browser spins in an infinite
  // redirect loop with no visible error. If the record is missing we create it
  // on the spot; only a genuine write failure shows an error screen.
  let artist: Artist | null = await getMyArtistProfile()

  if (!artist) {
    artist = await ensureArtistProfile()
  }

  if (!artist) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-4 rounded-lg border p-6 text-center">
          <h1 className="text-lg font-semibold tracking-tight">
            No pudimos cargar tu perfil
          </h1>
          <p className="text-sm text-muted-foreground">
            Tu sesión es válida, pero no conseguimos crear tu ficha de artista.
            Vuelve a intentarlo en unos segundos; si el problema continúa,
            escríbenos.
          </p>
          <div className="flex justify-center gap-2">
            <Button render={<Link href="/artista" />} size="sm">
              Reintentar
            </Button>
            <form action={signOut}>
              <Button variant="outline" size="sm" type="submit">
                Cerrar sesión
              </Button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ─── 4. Profile completeness ───
  // The guard used to live here and skipped itself on /artista/completar by
  // reading the x-pathname header injected by the middleware. That header does
  // not survive on Vercel, so isCompletarPage was always false and
  // /artista/completar redirected to itself forever — a blank screen and ~3
  // requests per second.
  //
  // A layout has no reliable way to know which route is rendering, so the
  // guard now lives in each page, which does know. See /artista and
  // /artista/editar. /artista/completar deliberately has none: it is the
  // destination.

  // ─── Display info ───
  const displayName =
    profile?.display_name ??
    user.user_metadata?.full_name ??
    user.email ??
    "Artista"
  const avatarUrl =
    profile?.avatar_url ?? user.user_metadata?.avatar_url ?? ""
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative before:absolute before:bottom-0 before:left-0 before:right-0 before:h-[1px] before:bg-gradient-to-r before:from-[#6E2FE3] before:via-[#F31A7C] before:to-[#0CABF7] before:opacity-40">
        <div className="container mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/artista"
            className="text-xl font-bold tracking-tight"
          >
            Apparta
          </Link>

          {/* User info + logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline-block">
                {displayName}
              </span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="sm" />}
              >
                <HugeiconsIcon icon={Settings01Icon} className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem render={<Link href="/artista/cuenta/correo" />}>
                  <HugeiconsIcon icon={Mail01Icon} className="size-4" />
                  Cambiar correo
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/artista/cuenta/contrasena" />}>
                  <HugeiconsIcon icon={LockPasswordIcon} className="size-4" />
                  Cambiar contraseña
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <form action={signOut}>
              <Button variant="ghost" size="sm" type="submit">
                Cerrar sesión
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  )
}

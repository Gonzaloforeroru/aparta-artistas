import { redirect } from "next/navigation"
import { headers } from "next/headers"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getMyArtistProfile } from "@/app/artista/actions"
import { isProfileComplete } from "@/app/artista/utils"
import { signOut } from "@/app/login/actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Settings01Icon } from "@hugeicons/core-free-icons"

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
  const artist = await getMyArtistProfile()

  if (!artist) {
    redirect("/login")
  }

  // ─── 4. Profile completeness guard ───
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") || ""
  const isCompletarPage = pathname.startsWith("/artista/completar")

  if (!isCompletarPage && !isProfileComplete(artist)) {
    redirect("/artista/completar")
  }

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
            <Link href="/artista/cuenta">
              <Button variant="ghost" size="sm">
                <HugeiconsIcon icon={Settings01Icon} className="size-4" />
              </Button>
            </Link>
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

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch admin profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name, avatar_url")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") {
    redirect("/login")
  }

  // Pending count for sidebar badge
  const { count: pendingCount } = await supabase
    .from("artists")
    .select("*", { count: "exact", head: true })
    .eq("status", "Pendiente")

  const adminUser = {
    name: profile.display_name ?? user.user_metadata?.full_name ?? user.email ?? "Admin",
    email: user.email ?? "",
    avatar: profile.avatar_url ?? user.user_metadata?.avatar_url ?? "",
  }

  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar user={adminUser} pendingCount={pendingCount ?? 0} />
          <SidebarInset>
            <div className="relative flex-1 overflow-hidden">
              <div className="pointer-events-none absolute inset-0 h-full w-full">
                <div className="absolute -top-[300px] -left-[200px] h-[800px] w-[800px] rounded-full bg-[#6E2FE3] opacity-20 blur-[150px]" />
                <div className="absolute top-[40%] right-[-100px] h-[600px] w-[600px] rounded-full bg-[#F31A7C] opacity-15 blur-[140px]" />
                <div className="absolute bottom-[10%] left-[20%] h-[500px] w-[500px] rounded-full bg-[#0CABF7] opacity-10 blur-[130px]" />
              </div>
              <div className="relative z-10">{children}</div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}

"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Music2Icon, LayoutDashboardIcon, ListIcon, CheckCircleIcon, BarChart3Icon, ExternalLinkIcon, UploadIcon, MailIcon } from "lucide-react"
import Link from "next/link"

const adminNav = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboardIcon,
    exact: true,
  },
  {
    title: "Artistas",
    url: "/admin/lista",
    icon: ListIcon,
  },
  {
    title: "Importar CSV",
    url: "/admin/importar",
    icon: UploadIcon,
  },
  {
    title: "Invitaciones",
    url: "/admin/invitaciones",
    icon: MailIcon,
  },
  {
    title: "Aprobaciones",
    url: "/admin/aprobaciones",
    icon: CheckCircleIcon,
  },
  {
    title: "Métricas",
    url: "/admin/metricas",
    icon: BarChart3Icon,
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: { name: string; email: string; avatar: string }
  pendingCount?: number
}

export function AppSidebar({ user, pendingCount = 0, ...props }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" className="top-(--header-height) h-[calc(100svh-var(--header-height))]!" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Music2Icon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Apparta</span>
                  <span className="truncate text-xs">Panel de Artistas</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Gestión</SidebarGroupLabel>
          <SidebarMenu>
            {adminNav.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={item.exact ? pathname === item.url : pathname?.startsWith(item.url)}
                  tooltip={item.title}
                >
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                {item.title === "Aprobaciones" && pendingCount > 0 && (
                  <SidebarMenuBadge>{pendingCount}</SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Ver Catálogo">
              <a href="/catalogo" target="_blank" rel="noopener noreferrer">
                <ExternalLinkIcon />
                <span>Ver Catálogo</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser
          user={user ?? {
            name: "Administrador",
            email: "admin@apparta.co",
            avatar: "",
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

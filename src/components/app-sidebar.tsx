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
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  MusicNote02Icon,
  DashboardSquare01Icon,
  ListViewIcon,
  CheckmarkCircle01Icon,
  BarChartIcon,
  ArrowUpRight01Icon,
  Upload01Icon,
  Mail01Icon,
} from "@hugeicons/core-free-icons"
import Link from "next/link"

const adminNav = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: DashboardSquare01Icon,
    exact: true,
  },
  {
    title: "Artistas",
    url: "/admin/lista",
    icon: ListViewIcon,
  },
  {
    title: "Importar CSV",
    url: "/admin/importar",
    icon: Upload01Icon,
  },
  {
    title: "Invitaciones",
    url: "/admin/invitaciones",
    icon: Mail01Icon,
  },
  {
    title: "Aprobaciones",
    url: "/admin/aprobaciones",
    icon: CheckmarkCircle01Icon,
  },
  {
    title: "Métricas",
    url: "/admin/metricas",
    icon: BarChartIcon,
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: { name: string; email: string; avatar: string }
  pendingCount?: number
}

export function AppSidebar({ user, pendingCount = 0, ...props }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar 
      collapsible="icon" 
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]! relative before:absolute before:right-0 before:top-0 before:bottom-0 before:w-[1px] before:bg-gradient-to-b before:from-[#6E2FE3] before:via-[#F31A7C] before:to-[#0CABF7] before:opacity-60"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/admin" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <HugeiconsIcon icon={MusicNote02Icon} className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Apparta</span>
                <span className="truncate text-xs">Panel de Artistas</span>
              </div>
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
                  render={<Link href={item.url} />}
                  isActive={item.exact ? pathname === item.url : pathname?.startsWith(item.url)}
                  tooltip={item.title}
                >
                  <HugeiconsIcon icon={item.icon as IconSvgElement} />
                  <span>{item.title}</span>
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
            <SidebarMenuButton render={<a href="/catalogo" target="_blank" rel="noopener noreferrer" />} tooltip="Ver Catálogo">
              <HugeiconsIcon icon={ArrowUpRight01Icon} />
              <span>Ver Catálogo</span>
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

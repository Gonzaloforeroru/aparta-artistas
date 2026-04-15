"use client"

import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import { HugeiconsIcon } from "@hugeicons/react"
import { Sun01Icon, Moon01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

const emptySubscribe = () => () => {}
function useIsMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = useIsMounted()

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
        <HugeiconsIcon icon={Sun01Icon} className="size-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? (
        <HugeiconsIcon icon={Sun01Icon} className="size-4" />
      ) : (
        <HugeiconsIcon icon={Moon01Icon} className="size-4" />
      )}
      <span className="sr-only">Cambiar tema</span>
    </Button>
  )
}

"use client";

import * as React from "react";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UnfoldMoreIcon,
  Tick02Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

/** "Electrónica" → "electronica", para buscar sin tildes. */
function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

const MAX_VISIBLE = 30;

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  /** Nombre del campo en el FormData. */
  name?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  required?: boolean;
  className?: string;
}

/**
 * Select con campo de búsqueda integrado.
 *
 * Pensado para catálogos grandes (198 géneros): la lista se recorta a
 * {@link MAX_VISIBLE} y el buscador filtra insensible a tildes con `fold()`.
 */
export function SearchableSelect({
  name,
  value,
  onValueChange,
  options,
  placeholder = "Seleccionar",
  required,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const needle = fold(search.trim());
    if (!needle) return options.slice(0, MAX_VISIBLE);
    return options
      .filter((o) => fold(o.label).includes(needle))
      .sort((a, b) => {
        const sa = fold(a.label).startsWith(needle) ? 0 : 1;
        const sb = fold(b.label).startsWith(needle) ? 0 : 1;
        return sa - sb || a.label.localeCompare(b.label, "es");
      })
      .slice(0, MAX_VISIBLE);
  }, [options, search]);

  const hiddenCount =
    !search.trim() ? Math.max(0, options.length - filtered.length) : 0;

  const close = useCallback(() => {
    setOpen(false);
    setSearch("");
  }, []);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, close]);

  // Auto-focus en la lupa al abrir
  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {name && <input type="hidden" name={name} value={value} required={required} />}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 w-full items-center justify-between gap-1.5 rounded-3xl border border-transparent bg-input/50 px-3 py-2 text-sm whitespace-nowrap transition-[color,box-shadow,background-color] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <span
          className={cn(
            "flex flex-1 text-left line-clamp-1",
            !selectedLabel && "text-muted-foreground",
          )}
        >
          {selectedLabel || placeholder}
        </span>
        <HugeiconsIcon
          icon={UnfoldMoreIcon}
          strokeWidth={2}
          className="pointer-events-none size-4 shrink-0 text-muted-foreground"
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-3xl bg-popover/70 text-popover-foreground shadow-lg ring-1 ring-foreground/5 backdrop-blur-2xl backdrop-saturate-150 dark:ring-foreground/10">
          <div className="p-2">
            <div className="relative">
              <HugeiconsIcon
                icon={Search01Icon}
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Buscar entre ${options.length} opciones…`}
                className="pl-9 text-sm"
                onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto p-1.5">
            {filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onValueChange(option.value);
                  close();
                }}
                className="relative flex w-full cursor-default items-center gap-2.5 rounded-2xl py-2 pr-8 pl-3 text-sm font-medium outline-hidden select-none hover:bg-foreground/10"
              >
                {option.label}
                {option.value === value && (
                  <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
                    <HugeiconsIcon
                      icon={Tick02Icon}
                      strokeWidth={2}
                      className="size-4"
                    />
                  </span>
                )}
              </button>
            ))}
            {hiddenCount > 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                y {hiddenCount} más — usa el buscador
              </p>
            )}
            {search.trim() && filtered.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                Sin resultados para &quot;{search.trim()}&quot;
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

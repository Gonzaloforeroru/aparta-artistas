"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import type { Tag, TagKind } from "@/lib/queries/tags";

/** "Electrónica" -> "electronica", para poder buscar sin tildes. */
function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** A partir de aqui la lista deja de ser navegable a ojo y aparece la lupa. */
const SEARCH_THRESHOLD = 20;
/** Tope de resultados en pantalla: pintar 196 chips es inservible. */
const MAX_RESULTS = 24;

type Props = {
  kind: TagKind;
  label: string;
  /** Catalogo oficial. Lo gestiona el admin; el artista solo elige. */
  options: Tag[];
  initialSelected: Tag[];
  /**
   * El instrumento no se pide a todo el mundo: una banda o una orquesta no
   * tienen "instrumento", lo tienen sus integrantes. Solo aporta algo cuando la
   * unidad es pequena (un solista de saxo), asi que se marca opcional.
   */
  required?: boolean;
  /** Aclara para que sirve el campo cuando no es evidente. */
  hint?: string;
};

/**
 * Selector multivalor sobre un catalogo CERRADO.
 *
 * Ya no se pueden proponer valores nuevos. Antes habia un campo "Proponer" y
 * paso justo lo que se temia: entraron "valenato" como TIPO de artista y
 * "reggue" como genero, indistinguibles de los oficiales. En vez de afinar la
 * deteccion de erratas, se amplio el catalogo (196 generos) para que no haga
 * falta inventar.
 */
export function TagPicker({
  kind,
  label,
  options,
  initialSelected,
  required = true,
  hint,
}: Props) {
  const byId = useMemo(() => {
    const map = new Map<string, Tag>();
    // Los ya asignados van tambien al mapa: puede haber alguno fuera del
    // catalogo oficial (una propuesta vieja) y no se debe perder al guardar.
    for (const tag of [...options, ...initialSelected]) map.set(tag.id, tag);
    return map;
  }, [options, initialSelected]);

  const [selected, setSelected] = useState<string[]>(
    initialSelected.map((t) => t.id),
  );
  const [search, setSearch] = useState("");

  const searchable = byId.size > SEARCH_THRESHOLD;

  const results = useMemo(() => {
    const all = [...byId.values()].filter((t) => !selected.includes(t.id));
    const needle = fold(search.trim());

    if (!needle) {
      // Sin busqueda solo se asoma el principio de la lista, para no tapar el
      // formulario con 196 chips.
      return searchable ? all.slice(0, MAX_RESULTS) : all;
    }

    // Los que empiezan por lo tecleado van primero: buscando "cum" interesa
    // mas "Cumbia" que "Cumbia Nortena".
    return all
      .filter((t) => fold(t.name).includes(needle))
      .sort((a, b) => {
        const sa = fold(a.name).startsWith(needle) ? 0 : 1;
        const sb = fold(b.name).startsWith(needle) ? 0 : 1;
        return sa - sb || a.name.localeCompare(b.name, "es");
      })
      .slice(0, MAX_RESULTS);
  }, [byId, selected, search, searchable]);

  const hidden = searchable && !search.trim()
    ? byId.size - selected.length - results.length
    : 0;

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>
        {label}{" "}
        {required ? (
          <span className="text-destructive">*</span>
        ) : (
          <span className="font-normal text-[var(--text-muted)]">(opcional)</span>
        )}
      </Label>
      {hint && (
        <p className="-mt-1 text-xs text-[var(--text-muted)]">{hint}</p>
      )}

      <input type="hidden" name={`tags_${kind}`} value={selected.join(",")} />

      {/* Lo elegido va arriba y siempre visible: con 196 opciones, si viviera
          mezclado con el resto el artista no sabria que lleva marcado. */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((id) => {
            const tag = byId.get(id);
            if (!tag) return null;
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--cta)] px-3 py-1 text-sm font-medium text-white"
                aria-label={`Quitar ${tag.name}`}
              >
                {tag.name}
                <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
              </button>
            );
          })}
        </div>
      )}

      {searchable && (
        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            // Generico a proposito: componer la frase con `label` daba
            // "Buscar en 110 tipo de artista...", mal en singular.
            placeholder={`Buscar entre ${byId.size} opciones...`}
            className="pl-9 text-sm"
            // Enter enviaria el formulario; aqui solo se filtra.
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {results.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id)}
            aria-pressed={false}
            className="rounded-full gradient-border-subtle bg-[var(--elevated)] px-3 py-1 text-sm font-medium text-[var(--text-secondary)] hover:text-foreground"
          >
            {tag.name}
          </button>
        ))}

        {hidden > 0 && (
          <span className="text-xs text-[var(--text-muted)]">
            y {hidden} más — usa el buscador
          </span>
        )}

        {search.trim() && results.length === 0 && (
          <span className="text-xs text-[var(--text-muted)]">
            Sin resultados para “{search.trim()}”
          </span>
        )}
      </div>
    </div>
  );
}

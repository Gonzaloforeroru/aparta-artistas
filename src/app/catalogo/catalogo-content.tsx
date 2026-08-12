"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { formatPrice, DURATION_OPTIONS, COST_SLIDER_CONFIG } from "@/lib/data";
import type { ArtistWithTags } from "@/lib/queries/artists";
import type { Tag } from "@/lib/queries/tags";

/**
 * Muestra u oculta el combobox de instrumento en el catalogo.
 *
 * Desactivado a proposito: quien contrata busca "un solista de jazz", no "un
 * saxofonista". Solo se oculta el CONTROL; el filtrado por ?profession= sigue
 * vivo para no romper enlaces, y el eje sigue existiendo en el formulario del
 * artista. Poner a true para reactivarlo.
 */
const MOSTRAR_FILTRO_INSTRUMENTO = false;
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  BubbleChatIcon,
  Clock01Icon,
  Location01Icon,
  MusicNote02Icon,
  Globe02Icon,
  LinkSquare01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import {
  YoutubeIcon,
  InstagramIcon,
  TikTokIcon,
  SpotifyIcon,
} from "@/components/social-icons";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";

/* ── Helpers ───────────────────────────────────────────── */

/** "Electrónica" → "electronica", para buscar sin tildes. */
function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/* ── Artist card ───────────────────────────────────────── */

function ArtistCard({ artist }: { artist: ArtistWithTags }) {
  const whatsappUrl = `https://wa.me/57${artist.phone}`;

  type SocialLink = { label: string; href: string; icon: (props: { className?: string }) => React.ReactNode; color: string };

  const socialLinks = ([
    artist.youtube ? { label: "YouTube", href: artist.youtube, icon: (p: { className?: string }) => <YoutubeIcon className={p.className} />, color: "bg-red-600 hover:bg-red-700" } : null,
    artist.instagram ? { label: "Instagram", href: artist.instagram, icon: (p: { className?: string }) => <InstagramIcon className={p.className} />, color: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" } : null,
    artist.tiktok ? { label: "TikTok", href: artist.tiktok, icon: (p: { className?: string }) => <TikTokIcon className={p.className} />, color: "bg-black hover:bg-gray-900" } : null,
    artist.spotify ? { label: "Spotify", href: artist.spotify, icon: (p: { className?: string }) => <SpotifyIcon className={p.className} />, color: "bg-green-600 hover:bg-green-700" } : null,
    artist.website ? { label: "Web", href: artist.website, icon: (p: { className?: string }) => <HugeiconsIcon icon={Globe02Icon} className={p.className} />, color: "bg-blue-600 hover:bg-blue-700" } : null,
  ] as (SocialLink | null)[]).filter((v): v is SocialLink => v !== null);

  // El municipio oficial DANE manda; artist.city queda como respaldo para los
  // registros que todavia no se han migrado.
  const cityLabel = artist.municipality?.name ?? artist.city;
  const badges = artist.tags.filter((t) => t.kind === "badge");
  const typeTags = artist.tags.filter((t) => t.kind === "artist_type");

  /**
   * Genero y profesion comparten fila: son "de que va" el artista. Se limitan a
   * tres y el resto se resume en "+N", porque un artista con ocho generos
   * desalineaba la rejilla al empujar los botones hacia abajo.
   */
  const descriptors = artist.tags.filter(
    (t) => t.kind === "genre" || t.kind === "profession",
  );
  const VISIBLE = 3;
  const shown = descriptors.slice(0, VISIBLE);
  const overflow = descriptors.length - shown.length;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl gradient-border-subtle bg-[var(--elevated)] transition-colors hover:bg-[var(--card-hover)]">
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {artist.photo ? (
          <Image
            src={artist.photo}
            alt={artist.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-[var(--surface-3)] text-4xl font-bold text-[var(--text-muted)]">
            {artist.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-[17px] font-bold leading-tight text-foreground">
              {artist.name}
            </h3>
            {/*
              La verificacion se reduce a un sello. Antes cada insignia ocupaba
              un chip entero y competia visualmente con los generos; el nombre
              de la institucion baja a la linea meta, que es donde se lee sin
              robar jerarquia.
            */}
            {badges.length > 0 && (
              <svg
                viewBox="0 0 100 100"
                className="size-[18px] shrink-0"
                aria-label="Artista verificado"
                role="img"
              >
                <polygon
                  points="50,0 60.87,9.43 75,6.7 79.7,20.3 93.3,25 90.57,39.13 100,50 90.57,60.87 93.3,75 79.7,79.7 75,93.3 60.87,90.57 50,100 39.13,90.57 25,93.3 20.3,79.7 6.7,75 9.43,60.87 0,50 9.43,39.13 6.7,25 20.3,20.3 25,6.7 39.13,9.43"
                  fill={badges[0].color ?? "#2f7bf6"}
                />
                <path
                  d="M30 52 L44 66 L72 36"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="11"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>

          <p className="truncate text-[13px] font-medium text-[var(--text-muted)]">
            {cityLabel}
          </p>

          {/*
            Los avales van en su propia fila y con su color, no mezclados en la
            linea meta junto a la ciudad.

            Una insignia no es un descriptor del artista (como el genero): es el
            respaldo de una institucion que responde por el, y el CHECK
            tags_badge_always_official garantiza que nadie se la puede inventar.
            Colgada de la linea de la ciudad se leia como un dato mas y, en
            cuanto un artista acumulaba dos, la linea crecia sin control.

            El color sale del propio tag para que cada institucion se reconozca
            de un vistazo. Se usa color-mix y no un hex con alfa porque el color
            lo teclea el admin y puede venir en cualquier formato CSS valido.
          */}
          {badges.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {badges.map((b) => {
                const c = b.color ?? "#2f7bf6";
                return (
                  <span
                    key={b.id}
                    title={`Avalado por ${b.name}`}
                    className="inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-[3px] text-[11px] font-semibold"
                    style={{
                      color: c,
                      borderColor: `color-mix(in srgb, ${c} 45%, transparent)`,
                      backgroundColor: `color-mix(in srgb, ${c} 14%, transparent)`,
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="size-3 shrink-0"
                      aria-hidden="true"
                    >
                      <path
                        d="M5 13l4 4L19 7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="truncate">{b.name}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/*
          min-h fija la altura de esta fila aunque un artista no tenga tags: sin
          ella las tarjetas de la rejilla quedaban desalineadas entre si.
        */}
        <div className="flex min-h-[26px] flex-wrap items-center gap-1.5">
          {typeTags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full bg-[var(--text-primary,#e8eaf0)] px-2.5 py-1 text-[11.5px] font-bold text-[var(--background)]"
            >
              {tag.name}
            </span>
          ))}
          {shown.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full border border-white/15 px-2.5 py-[3px] text-[11.5px] font-semibold text-[var(--text-secondary)]"
            >
              {tag.name}
            </span>
          ))}
          {overflow > 0 && (
            <span
              title={descriptors.slice(VISIBLE).map((t) => t.name).join(", ")}
              className="text-[11.5px] font-semibold text-[var(--text-muted)]"
            >
              +{overflow}
            </span>
          )}
        </div>

        {/* mt-auto empuja precio y botones abajo para que los CTA queden a la
            misma altura en toda la fila. */}
        <div className="mt-auto flex items-baseline justify-between border-t border-white/[0.07] pt-3">
          <span className="text-xl font-extrabold text-foreground">
            {formatPrice(artist.price)}
          </span>
          <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
            <HugeiconsIcon icon={Clock01Icon} className="size-3.5" />
            {artist.duration}
          </span>
        </div>

        {/* CTA Buttons. Sin mt-auto: ya lo lleva la fila de precio y dos
            margenes automaticos se repartirian el hueco entre ambos. */}
        <div className="flex gap-2">
          {artist.phone && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={socialLinks.length > 0 ? "flex-1" : "w-full"}
            >
              <Button className="h-11 w-full gap-2 rounded-full bg-[var(--whatsapp)] font-bold text-white hover:bg-[var(--whatsapp-hover)]">
                <HugeiconsIcon icon={BubbleChatIcon} className="size-4" />
                Contactar
              </Button>
            </a>
          )}

          {socialLinks.length === 1 && (
            <a
              href={socialLinks[0].href}
              target="_blank"
              rel="noopener noreferrer"
              className={artist.phone ? "flex-1" : "w-full"}
            >
              <Button className={`h-11 w-full gap-2 rounded-full font-semibold text-white ${socialLinks[0].color}`}>
                {socialLinks[0].icon({ className: "size-4" })}
                {socialLinks[0].label}
              </Button>
            </a>
          )}

          {socialLinks.length >= 2 && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button className={`h-11 gap-2 rounded-full bg-[var(--elevated)] font-semibold text-foreground gradient-border-subtle hover:bg-[var(--card-hover)] ${artist.phone ? "flex-1" : "w-full"}`} />
                }
              >
                <HugeiconsIcon icon={LinkSquare01Icon} className="size-4" />
                Redes
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8}>
                {socialLinks.map((link) => (
                  <DropdownMenuItem
                    key={link.label}
                    render={<a href={link.href} target="_blank" rel="noopener noreferrer" />}
                  >
                    {link.icon({ className: "size-4" })}
                    {link.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Tag Combobox ──────────────────────────────────────── */

/**
 * Combobox buscable multivalor. Sustituye al muro de chips: un trigger compacto
 * abre un panel con buscador y opciones con conteo de artistas.
 *
 * Patron de busqueda tomado de tag-picker.tsx: fold() para quitar tildes,
 * prefijos primero (buscando "cum" sale "Cumbia" antes que "Cumbia Nortena").
 */
function TagCombobox({
  label,
  tags,
  selected,
  counts,
  onToggle,
}: {
  label: string;
  tags: Tag[];
  selected: string[];
  counts: Map<string, number>;
  onToggle: (slug: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar al clicar fuera o pulsar Escape.
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const sorted = useMemo(() => {
    const needle = fold(search.trim());
    // Lo seleccionado no aparece en la lista: se ve como chip arriba.
    let opts = tags.filter((t) => !selected.includes(t.slug));

    if (needle) {
      // Coincidencias por prefijo primero, luego alfabetico.
      opts = opts
        .filter((t) => fold(t.name).includes(needle))
        .sort((a, b) => {
          const sa = fold(a.name).startsWith(needle) ? 0 : 1;
          const sb = fold(b.name).startsWith(needle) ? 0 : 1;
          return sa - sb || a.name.localeCompare(b.name, "es");
        });
    } else {
      // Sin busqueda: opciones con 0 artistas van al final.
      opts.sort((a, b) => {
        const ca = counts.get(a.slug) ?? 0;
        const cb = counts.get(b.slug) ?? 0;
        if (ca === 0 && cb > 0) return 1;
        if (cb === 0 && ca > 0) return -1;
        return cb - ca || a.name.localeCompare(b.name, "es");
      });
    }

    return opts;
  }, [tags, selected, search, counts]);

  const selectedTags = useMemo(
    () => tags.filter((t) => selected.includes(t.slug)),
    [tags, selected],
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          setSearch("");
        }}
        className="inline-flex h-11 w-full items-center gap-2 rounded-full gradient-border-subtle bg-[var(--elevated)] px-4 text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap transition-colors hover:bg-[var(--card-hover)] sm:w-auto"
      >
        <span className="truncate">{label}</span>
        {selected.length > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-[var(--cta)] text-[11px] font-bold tabular-nums text-white">
            {selected.length}
          </span>
        )}
        <svg
          className={`size-3.5 shrink-0 text-[var(--text-muted)] transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/*
        Panel flotante.

        NO usar bg-[var(--elevated)] aqui: esa variable es #FFFFFF14, un tinte
        de elevacion del 8% pensado para superponerse a un fondo OPACO (las
        tarjetas, los botones). Sobre un panel flotante deja ver la pagina
        entera a traves — las fotos de los artistas y el slider de precio se
        leian por debajo de los nombres.

        Se usa el mismo tratamiento que SelectContent en components/ui/select.tsx:
        color de popover al 70% con desenfoque detras.
      */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-72 overflow-hidden rounded-xl border border-white/10 bg-popover/70 shadow-2xl backdrop-blur-2xl backdrop-saturate-150">
          {/* Chips de lo seleccionado, arriba y siempre visible */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-b border-white/[0.07] px-3 py-2.5">
              {selectedTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => onToggle(tag.slug)}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--cta)] px-2.5 py-0.5 text-xs font-medium text-white"
                  aria-label={`Quitar ${tag.name}`}
                >
                  {tag.name}
                  <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
                </button>
              ))}
            </div>
          )}

          {/* Buscador */}
          <div className="relative border-b border-white/[0.07] px-3 py-2">
            <HugeiconsIcon
              icon={Search01Icon}
              className="absolute left-5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              ref={(el) => el?.focus()}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Buscar ${label.toLowerCase()}\u2026`}
              // pl-8 y no pl-6: con 24px el texto arrancaba a 2px de la lupa y
            // parecian pegados. El TagPicker del formulario deja ~8px.
            className="w-full bg-transparent py-1 pl-8 text-sm text-foreground placeholder:text-[var(--text-muted)] outline-none"
              onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
            />
          </div>

          {/* Lista de opciones */}
          <div className="max-h-64 overflow-y-auto py-1">
            {sorted.length === 0 && search.trim() && (
              <p className="px-3 py-4 text-center text-xs text-[var(--text-muted)]">
                Sin resultados para &quot;{search.trim()}&quot;
              </p>
            )}
            {sorted.length === 0 && !search.trim() && (
              <p className="px-3 py-4 text-center text-xs text-[var(--text-muted)]">
                Todas las opciones están seleccionadas
              </p>
            )}
            {sorted.map((tag) => {
              const count = counts.get(tag.slug) ?? 0;
              const dimmed = count === 0;
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => onToggle(tag.slug)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--card-hover)] ${
                    dimmed
                      ? "text-[var(--text-muted)]"
                      : "text-[var(--text-secondary)]"
                  }`}
                >
                  <span className="truncate">{tag.name}</span>
                  <span className="ml-2 shrink-0 text-xs tabular-nums text-[var(--text-muted)]">
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main component ────────────────────────────────────── */

type Props = {
  artists: ArtistWithTags[];
  tagsByKind: { artist_type: Tag[]; genre: Tag[]; profession: Tag[] };
};

/**
 * Suspense obligatorio: useSearchParams() marca el arbol como dinamico y sin
 * este limite el build de Next falla al prerenderizar /catalogo.
 */
export function CatalogoContent(props: Props) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-6 py-10" />}>
      <CatalogoInner {...props} />
    </Suspense>
  );
}

function CatalogoInner({ artists, tagsByKind }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /**
   * La URL es la unica fuente de verdad de los filtros: asi el enlace se puede
   * compartir y el boton atras del navegador recorre los estados. La unica
   * excepcion es el texto de busqueda, que se mantiene local para poder
   * escribir fluido y solo se vuelca a la URL con debounce.
   */
  const list = useCallback(
    (key: string) => {
      const raw = searchParams.get(key);
      return raw ? raw.split(",").filter(Boolean) : [];
    },
    [searchParams],
  );

  const selectedTypes = list("type");
  const selectedGenres = list("genre");
  const selectedProfessions = list("profession");
  const cityFilter = searchParams.get("city") ?? "all";
  const durationFilter = searchParams.get("duration") ?? "all";
  const queryFromUrl = searchParams.get("q") ?? "";
  const minPrice = Number(searchParams.get("minPrice") ?? COST_SLIDER_CONFIG.min);
  const maxPrice = Number(searchParams.get("maxPrice") ?? COST_SLIDER_CONFIG.max);

  const setParams = useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === "" || value === "all") next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const toggleInParam = useCallback(
    (key: string, slug: string) => {
      const current = list(key);
      const next = current.includes(slug)
        ? current.filter((s) => s !== slug)
        : [...current, slug];
      setParams({ [key]: next.join(",") });
    },
    [list, setParams],
  );

  // ── Conteo de artistas por tag (sobre el total, no filtrado) ──
  const tagCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const artist of artists) {
      for (const tag of artist.tags) {
        map.set(tag.slug, (map.get(tag.slug) ?? 0) + 1);
      }
    }
    return map;
  }, [artists]);

  // ── Chips de seleccion combinados (tres ejes) ───────
  const allSelectedChips = useMemo(() => {
    const items: { slug: string; name: string; paramKey: string }[] = [];
    for (const slug of selectedTypes) {
      const tag = tagsByKind.artist_type.find((t) => t.slug === slug);
      if (tag) items.push({ slug, name: tag.name, paramKey: "type" });
    }
    for (const slug of selectedGenres) {
      const tag = tagsByKind.genre.find((t) => t.slug === slug);
      if (tag) items.push({ slug, name: tag.name, paramKey: "genre" });
    }
    for (const slug of selectedProfessions) {
      const tag = tagsByKind.profession.find((t) => t.slug === slug);
      if (tag) items.push({ slug, name: tag.name, paramKey: "profession" });
    }
    return items;
  }, [selectedTypes, selectedGenres, selectedProfessions, tagsByKind]);

  // ── Busqueda con debounce ────────────────────────────
  const [searchDraft, setSearchDraft] = useState(queryFromUrl);

  // Si la URL cambia por fuera (atras/adelante, "limpiar filtros"), el input
  // debe seguirla.
  useEffect(() => {
    setSearchDraft(queryFromUrl);
  }, [queryFromUrl]);

  useEffect(() => {
    if (searchDraft === queryFromUrl) return;
    const timer = setTimeout(() => setParams({ q: searchDraft }), 300);
    return () => clearTimeout(timer);
  }, [searchDraft, queryFromUrl, setParams]);

  // ── Rango de precio: local mientras se arrastra ──────
  const [priceDraft, setPriceDraft] = useState<number[]>([minPrice, maxPrice]);
  useEffect(() => {
    setPriceDraft([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);

  // Ciudades: solo las que realmente aparecen en los resultados, no los 1122
  // municipios del pais.
  const cityOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const artist of artists) {
      const code = artist.municipality?.code ?? artist.city;
      const name = artist.municipality?.name ?? artist.city;
      if (code && name && !seen.has(code)) seen.set(code, name);
    }
    return [...seen.entries()]
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [artists]);

  const filtered = useMemo(() => {
    const needle = queryFromUrl.trim().toLowerCase();

    return artists.filter((artist) => {
      const matchesSearch =
        !needle || artist.name.toLowerCase().includes(needle);

      const cityCode = artist.municipality?.code ?? artist.city;
      const matchesCity = cityFilter === "all" || cityCode === cityFilter;

      const matchesDuration =
        durationFilter === "all" || artist.duration === durationFilter;

      // OR dentro de cada grupo, AND entre grupos.
      const slugs = new Set(artist.tags.map((t) => t.slug));
      const matchesType =
        selectedTypes.length === 0 || selectedTypes.some((s) => slugs.has(s));
      const matchesGenre =
        selectedGenres.length === 0 || selectedGenres.some((s) => slugs.has(s));
      const matchesProfession =
        selectedProfessions.length === 0 ||
        selectedProfessions.some((s) => slugs.has(s));

      const matchesPrice = artist.price >= minPrice && artist.price <= maxPrice;

      return (
        matchesSearch &&
        matchesCity &&
        matchesDuration &&
        matchesType &&
        matchesGenre &&
        matchesProfession &&
        matchesPrice
      );
    });
  }, [
    artists,
    queryFromUrl,
    cityFilter,
    durationFilter,
    selectedTypes,
    selectedGenres,
    selectedProfessions,
    minPrice,
    maxPrice,
  ]);

  const activeCount =
    selectedTypes.length +
    selectedGenres.length +
    selectedProfessions.length +
    (cityFilter !== "all" ? 1 : 0) +
    (durationFilter !== "all" ? 1 : 0) +
    (queryFromUrl ? 1 : 0) +
    (minPrice !== COST_SLIDER_CONFIG.min || maxPrice !== COST_SLIDER_CONFIG.max
      ? 1
      : 0);

  const hasActiveFilters = activeCount > 0;

  function clearFilters() {
    router.replace(pathname, { scroll: false });
  }

  const cityLabel =
    cityFilter === "all"
      ? "Ciudad"
      : (cityOptions.find((c) => c.code === cityFilter)?.name ?? "Ciudad");

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* ── Header ──────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
          Explorar Artistas
        </h1>
        <p className="mt-2 text-[var(--text-muted)]">
          Descubre artistas verificados en Colombia, explora por categoría o
          busca por nombre.
        </p>
      </div>

      {/* ── Filtros de una sola opcion ──────────────── */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          value={cityFilter}
          onValueChange={(v) => setParams({ city: (v as string) ?? "all" })}
        >
          <SelectTrigger className="h-11 w-full rounded-full gradient-border-subtle bg-[var(--elevated)] sm:w-48">
            <HugeiconsIcon
              icon={Location01Icon}
              className="mr-1.5 size-4 text-[var(--text-muted)]"
            />
            <span className="flex-1 truncate text-left">{cityLabel}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las ciudades</SelectItem>
            {cityOptions.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={durationFilter}
          onValueChange={(v) => setParams({ duration: (v as string) ?? "all" })}
        >
          <SelectTrigger className="h-11 w-full rounded-full gradient-border-subtle bg-[var(--elevated)] sm:w-48">
            <HugeiconsIcon
              icon={Clock01Icon}
              className="mr-1.5 size-4 text-[var(--text-muted)]"
            />
            <span className="flex-1 text-left">
              {durationFilter === "all" ? "Duración" : durationFilter}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las duraciones</SelectItem>
            {DURATION_OPTIONS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative sm:ml-auto sm:w-56">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <Input
            placeholder="Buscar..."
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            className="h-11 rounded-full gradient-border-subtle bg-[var(--elevated)] pl-11 text-sm placeholder:text-[var(--text-muted)]"
          />
        </div>
      </div>

      {/* ── Comboboxes multivalor ───────────────────── */}
      <div className="mb-4 flex flex-wrap gap-2">
        <TagCombobox
          label="Tipo de artista"
          tags={tagsByKind.artist_type}
          selected={selectedTypes}
          counts={tagCounts}
          onToggle={(slug) => toggleInParam("type", slug)}
        />
        <TagCombobox
          label="Género"
          tags={tagsByKind.genre}
          selected={selectedGenres}
          counts={tagCounts}
          onToggle={(slug) => toggleInParam("genre", slug)}
        />
        {/*
          Filtro por instrumento desactivado de momento: casi nadie busca "un
          saxofonista", busca "un solista de jazz". Se oculta solo el control,
          NO el filtrado: el eje sigue en la base y en el formulario del
          artista, y un enlace con ?profession= sigue funcionando y se puede
          quitar desde los chips de filtros activos. Poner a true para
          reactivarlo.
        */}
        {MOSTRAR_FILTRO_INSTRUMENTO && (
          <TagCombobox
            label="Instrumento"
            tags={tagsByKind.profession}
            selected={selectedProfessions}
            counts={tagCounts}
            onToggle={(slug) => toggleInParam("profession", slug)}
          />
        )}
      </div>

      {/* ── Chips de filtros activos + limpiar ──────── */}
      {hasActiveFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {allSelectedChips.map((item) => (
            <button
              key={`${item.paramKey}-${item.slug}`}
              type="button"
              onClick={() => toggleInParam(item.paramKey, item.slug)}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--cta)] px-2.5 py-1 text-xs font-medium text-white"
              aria-label={`Quitar ${item.name}`}
            >
              {item.name}
              <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
            </button>
          ))}
          <span className="text-xs text-[var(--text-muted)]">
            {activeCount} filtro{activeCount !== 1 ? "s" : ""} activo
            {activeCount !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-medium text-[var(--cta)] transition-colors hover:opacity-70"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* ── Rango de precio ─────────────────────────── */}
      <div className="mb-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[var(--text-muted)]">
          Rango de precio
        </p>
        <div className="rounded-2xl gradient-border-subtle bg-[var(--elevated)] px-5 py-4">
          <Slider
            value={priceDraft}
            onValueChange={(val) => setPriceDraft(val as number[])}
            onValueCommitted={(val) => {
              const [lo, hi] = val as number[];
              setParams({
                minPrice: lo === COST_SLIDER_CONFIG.min ? null : String(lo),
                maxPrice: hi === COST_SLIDER_CONFIG.max ? null : String(hi),
              });
            }}
            min={COST_SLIDER_CONFIG.min}
            max={COST_SLIDER_CONFIG.max}
            step={COST_SLIDER_CONFIG.step}
          />
          <div className="mt-3 flex items-center justify-between text-sm text-[var(--text-muted)]">
            <span>{formatPrice(priceDraft[0])}</span>
            <span>—</span>
            <span>{formatPrice(priceDraft[1])}</span>
          </div>
        </div>
      </div>

      {/* ── Resultados ──────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold">
          {hasActiveFilters ? "Resultados" : "Artistas populares"}
        </h2>
        <p className="text-xs text-[var(--text-muted)]">
          {filtered.length} artista{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl gradient-border-subtle bg-[var(--elevated)] py-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-[var(--surface-3)]">
            <HugeiconsIcon
              icon={MusicNote02Icon}
              className="size-6 text-[var(--text-muted)]"
            />
          </div>
          <p className="mt-4 text-base font-medium text-foreground">
            No se encontraron artistas
          </p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Intenta con otros filtros de búsqueda
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4 rounded-full"
              onClick={clearFilters}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

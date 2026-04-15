"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cities, artistTypes, genres, formatPrice } from "@/lib/data";
import type { Tables } from "@/lib/supabase/database.types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  BubbleChatIcon,
  Clock01Icon,
  Location01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import {
  InstagramIcon,
  YoutubeIcon,
  TikTokIcon,
  SpotifyIcon,
} from "@/components/social-icons";
import Image from "next/image";

type Artist = Tables<"artists">;

/* ── Type icons & emoji mapping ────────────────────────── */

const TYPE_EMOJI: Record<string, string> = {
  Cantante: "🎤",
  DJ: "🎧",
  Banda: "🎸",
  Mariachi: "🎺",
  "Grupo Musical": "🎵",
  Solista: "🎙️",
};

/* ── Social link ───────────────────────────────────────── */

function SocialLink({
  href,
  children,
}: {
  href?: string | null;
  children: React.ReactNode;
}) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[var(--text-muted)] transition-colors hover:text-foreground"
    >
      {children}
    </a>
  );
}

/* ── Artist card ───────────────────────────────────────── */

function ArtistCard({ artist }: { artist: Artist }) {
  const whatsappUrl = `https://wa.me/57${artist.phone}`;

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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg font-bold text-white">{artist.name}</h3>
          <div className="mt-0.5 flex items-center gap-1.5 text-sm text-white/70">
            <HugeiconsIcon icon={Location01Icon} className="size-3.5" />
            <span>{artist.city}</span>
            <span className="mx-0.5">·</span>
            <span>{artist.genre}</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-foreground">
            {formatPrice(artist.price)}
          </span>
          <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
            <HugeiconsIcon icon={Clock01Icon} className="size-3.5" />
            {artist.duration}
          </span>
        </div>

        {/* Socials */}
        <div className="flex items-center gap-3">
          <SocialLink href={artist.instagram}>
            <InstagramIcon className="size-4" />
          </SocialLink>
          <SocialLink href={artist.tiktok}>
            <TikTokIcon className="size-4" />
          </SocialLink>
          <SocialLink href={artist.youtube}>
            <YoutubeIcon className="size-4" />
          </SocialLink>
          <SocialLink href={artist.spotify}>
            <SpotifyIcon className="size-4" />
          </SocialLink>
        </div>

        {/* CTA */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto"
        >
          <Button className="w-full gap-2 rounded-full bg-[var(--whatsapp)] text-white font-medium hover:bg-[var(--whatsapp-hover)]">
            <HugeiconsIcon icon={BubbleChatIcon} className="size-4" />
            Contactar
          </Button>
        </a>
      </div>
    </div>
  );
}

/* ── Category card (clickable filter) ──────────────────── */

function CategoryCard({
  type,
  count,
  active,
  onClick,
}: {
  type: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const emoji = TYPE_EMOJI[type] ?? "🎵";

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors ${
        active
          ? "border border-[var(--cta)]/40 bg-[var(--cta)]/10"
          : "gradient-border-subtle bg-[var(--elevated)] hover:bg-[var(--card-hover)]"
      }`}
    >
      <span className="text-xl">{emoji}</span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{type}</p>
        <p className="text-xs text-[var(--text-muted)]">
          {count} artista{count !== 1 ? "s" : ""}
        </p>
      </div>
    </button>
  );
}

/* ── Genre pill ────────────────────────────────────────── */

function GenrePill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-[var(--cta)] text-[var(--cta-foreground)]"
          : "gradient-border-subtle text-[var(--text-muted)] hover:bg-[var(--card-hover)] hover:text-foreground"
      }`}
    >
      {label}
      {active && <HugeiconsIcon icon={Cancel01Icon} className="size-3" />}
    </button>
  );
}

/* ── Main component ────────────────────────────────────── */

export function CatalogoContent({ artists }: { artists: Artist[] }) {
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [genreFilter, setGenreFilter] = useState("all");

  /* Count artists per type */
  const typeCounts = useMemo(() => {
    const map = new Map<string, number>();
    artists.forEach((a) => map.set(a.type, (map.get(a.type) ?? 0) + 1));
    return map;
  }, [artists]);

  const filtered = artists.filter((artist) => {
    const matchesSearch = artist.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCity = cityFilter === "all" || artist.city === cityFilter;
    const matchesType = typeFilter === "all" || artist.type === typeFilter;
    const matchesGenre = genreFilter === "all" || artist.genre === genreFilter;
    return matchesSearch && matchesCity && matchesType && matchesGenre;
  });

  const hasActiveFilters =
    cityFilter !== "all" || typeFilter !== "all" || genreFilter !== "all";

  function clearFilters() {
    setCityFilter("all");
    setTypeFilter("all");
    setGenreFilter("all");
    setSearch("");
  }

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

      {/* ── Search + City filter ─────────────────────── */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]"
          />
           <Input
             placeholder="Buscar artista..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="h-11 rounded-full gradient-border-subtle bg-[var(--elevated)] pl-11 text-sm placeholder:text-[var(--text-muted)]"
           />
        </div>
        <Select
          value={cityFilter}
          onValueChange={(v) => setCityFilter(v ?? "all")}
        >
           <SelectTrigger className="h-11 w-full rounded-full gradient-border-subtle bg-[var(--elevated)] sm:w-44">
            <HugeiconsIcon
              icon={Location01Icon}
              className="mr-1.5 size-4 text-[var(--text-muted)]"
            />
            <SelectValue placeholder="Ciudad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las ciudades</SelectItem>
            {cities.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Categorías (type filter cards) ───────────── */}
      <div className="mb-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[var(--text-muted)]">
          Categorías
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {artistTypes.map((t) => (
            <CategoryCard
              key={t}
              type={t}
              count={typeCounts.get(t) ?? 0}
              active={typeFilter === t}
              onClick={() => setTypeFilter(typeFilter === t ? "all" : t)}
            />
          ))}
        </div>
      </div>

      {/* ── Géneros (pill filters) ──────────────────── */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        {genres.map((g) => (
          <GenrePill
            key={g}
            label={g}
            active={genreFilter === g}
            onClick={() => setGenreFilter(genreFilter === g ? "all" : g)}
          />
        ))}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="ml-2 text-xs font-medium text-[var(--cta)] transition-colors hover:text-[var(--cta)]/80"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* ── Results header ──────────────────────────── */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold">
          {hasActiveFilters || search ? "Resultados" : "Artistas populares"}
        </h2>
        <p className="text-xs text-[var(--text-muted)]">
          {filtered.length} artista{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* ── Grid ────────────────────────────────────── */}
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
              icon={Search01Icon}
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

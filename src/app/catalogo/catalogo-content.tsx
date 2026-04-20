"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cities, genres, formatPrice, DURATION_OPTIONS, COST_SLIDER_CONFIG } from "@/lib/data";
import type { Tables } from "@/lib/supabase/database.types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  BubbleChatIcon,
  Clock01Icon,
  Location01Icon,
  Cancel01Icon,
  MusicNote02Icon,
  Globe02Icon,
  LinkSquare01Icon,
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

type Artist = Tables<"artists">;


/* ── Artist card ───────────────────────────────────────── */

function ArtistCard({ artist }: { artist: Artist }) {
  const whatsappUrl = `https://wa.me/57${artist.phone}`;

  type SocialLink = { label: string; href: string; icon: (props: { className?: string }) => React.ReactNode; color: string };

  const socialLinks = ([
    artist.youtube ? { label: "YouTube", href: artist.youtube, icon: (p: { className?: string }) => <YoutubeIcon className={p.className} />, color: "bg-red-600 hover:bg-red-700" } : null,
    artist.instagram ? { label: "Instagram", href: artist.instagram, icon: (p: { className?: string }) => <InstagramIcon className={p.className} />, color: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" } : null,
    artist.tiktok ? { label: "TikTok", href: artist.tiktok, icon: (p: { className?: string }) => <TikTokIcon className={p.className} />, color: "bg-black hover:bg-gray-900" } : null,
    artist.spotify ? { label: "Spotify", href: artist.spotify, icon: (p: { className?: string }) => <SpotifyIcon className={p.className} />, color: "bg-green-600 hover:bg-green-700" } : null,
    artist.website ? { label: "Web", href: artist.website, icon: (p: { className?: string }) => <HugeiconsIcon icon={Globe02Icon} className={p.className} />, color: "bg-blue-600 hover:bg-blue-700" } : null,
  ] as (SocialLink | null)[]).filter((v): v is SocialLink => v !== null);

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

        {/* CTA Buttons */}
        <div className="mt-auto flex gap-2">
          {artist.phone && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={socialLinks.length > 0 ? "flex-1" : "w-full"}
            >
              <Button className="w-full gap-2 rounded-full bg-[var(--whatsapp)] text-white font-medium hover:bg-[var(--whatsapp-hover)]">
                <HugeiconsIcon icon={BubbleChatIcon} className="size-4" />
                Contactar
              </Button>
            </a>
          )}

          {/* Single social link → direct button */}
          {socialLinks.length === 1 && (
            <a
              href={socialLinks[0].href}
              target="_blank"
              rel="noopener noreferrer"
              className={artist.phone ? "flex-1" : "w-full"}
            >
              <Button className={`w-full gap-2 rounded-full text-white font-medium ${socialLinks[0].color}`}>
                {socialLinks[0].icon({ className: "size-4" })}
                {socialLinks[0].label}
              </Button>
            </a>
          )}

          {/* Multiple social links → dropdown */}
          {socialLinks.length >= 2 && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button className={`gap-2 rounded-full bg-[var(--elevated)] text-foreground font-medium gradient-border-subtle hover:bg-[var(--card-hover)] ${artist.phone ? "flex-1" : "w-full"}`} />
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

/* ── Main component ────────────────────────────────────── */

export function CatalogoContent({ artists }: { artists: Artist[] }) {
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");
  const [genreFilter, setGenreFilter] = useState("all");
  const [priceRange, setPriceRange] = useState<number[]>([COST_SLIDER_CONFIG.min, COST_SLIDER_CONFIG.max]);

  const filtered = artists.filter((artist) => {
    const matchesSearch = artist.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCity = cityFilter === "all" || artist.city === cityFilter;
    const matchesDuration = durationFilter === "all" || artist.duration === durationFilter;
    const matchesGenre = genreFilter === "all" || artist.genre === genreFilter;
    const matchesPrice = artist.price >= priceRange[0] && artist.price <= priceRange[1];
    return matchesSearch && matchesCity && matchesDuration && matchesGenre && matchesPrice;
  });

  const hasActiveFilters =
    cityFilter !== "all" ||
    durationFilter !== "all" ||
    genreFilter !== "all" ||
    priceRange[0] !== COST_SLIDER_CONFIG.min ||
    priceRange[1] !== COST_SLIDER_CONFIG.max;

  function clearFilters() {
    setCityFilter("all");
    setDurationFilter("all");
    setGenreFilter("all");
    setPriceRange([COST_SLIDER_CONFIG.min, COST_SLIDER_CONFIG.max]);
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

      {/* ── Filters ─────────────────────────────────── */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          value={cityFilter}
          onValueChange={(v) => setCityFilter(v ?? "all")}
        >
           <SelectTrigger className="h-11 w-full rounded-full gradient-border-subtle bg-[var(--elevated)] sm:w-48">
            <HugeiconsIcon
              icon={Location01Icon}
              className="mr-1.5 size-4 text-[var(--text-muted)]"
            />
            <span className="flex-1 text-left">{cityFilter === "all" ? "Ciudad" : cityFilter}</span>
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
        <Select
          value={durationFilter}
          onValueChange={(v) => setDurationFilter(v ?? "all")}
        >
          <SelectTrigger className="h-11 w-full rounded-full gradient-border-subtle bg-[var(--elevated)] sm:w-48">
            <HugeiconsIcon
              icon={Clock01Icon}
              className="mr-1.5 size-4 text-[var(--text-muted)]"
            />
            <span className="flex-1 text-left">{durationFilter === "all" ? "Duración" : durationFilter}</span>
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
        <Select
          value={genreFilter}
          onValueChange={(v) => setGenreFilter(v ?? "all")}
        >
          <SelectTrigger className="h-11 w-full rounded-full gradient-border-subtle bg-[var(--elevated)] sm:w-48">
            <HugeiconsIcon
              icon={MusicNote02Icon}
              className="mr-1.5 size-4 text-[var(--text-muted)]"
            />
            <span className="flex-1 text-left">{genreFilter === "all" ? "Género" : genreFilter}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los géneros</SelectItem>
            {genres.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
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
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="h-11 rounded-full gradient-border-subtle bg-[var(--elevated)] pl-11 text-sm placeholder:text-[var(--text-muted)]"
           />
        </div>
      </div>

      {/* ── Rango de precio (cost slider) ────────────── */}
      <div className="mb-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[var(--text-muted)]">
          Rango de precio
        </p>
        <div className="rounded-2xl gradient-border-subtle bg-[var(--elevated)] px-5 py-4">
          <Slider
            value={priceRange}
            onValueChange={(val) => setPriceRange(val as number[])}
            min={COST_SLIDER_CONFIG.min}
            max={COST_SLIDER_CONFIG.max}
            step={COST_SLIDER_CONFIG.step}
          />
          <div className="mt-3 flex items-center justify-between text-sm text-[var(--text-muted)]">
            <span>{formatPrice(priceRange[0])}</span>
            <span>—</span>
            <span>{formatPrice(priceRange[1])}</span>
          </div>
        </div>
      </div>

      {/* ── Active filters indicator ──────────────────── */}
      {hasActiveFilters && (
        <div className="mb-8 flex items-center">
          <button
            onClick={clearFilters}
            className="text-xs font-medium text-[var(--cta)] transition-colors hover:text-[var(--cta)]/80"
          >
            Limpiar filtros
          </button>
        </div>
      )}

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

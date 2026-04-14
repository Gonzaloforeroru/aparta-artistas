"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cities, artistTypes, genres, formatPrice } from "@/lib/data";
import type { Tables } from "@/lib/supabase/database.types";
import {
  Search,
  MessageCircle,
  Clock,
  MapPin,
  X,
} from "lucide-react";
import { InstagramIcon, YoutubeIcon, TikTokIcon, SpotifyIcon } from "@/components/social-icons";
import Image from "next/image";
import Link from "next/link";

type Artist = Tables<"artists">;

const TYPE_COLORS: Record<string, string> = {
  Cantante: "bg-chart-1/15 text-chart-1 border-chart-1/25",
  DJ: "bg-chart-4/15 text-chart-4 border-chart-4/25",
  Banda: "bg-chart-2/15 text-chart-2 border-chart-2/25",
  Mariachi: "bg-chart-3/15 text-chart-3 border-chart-3/25",
  "Grupo Musical": "bg-chart-5/15 text-chart-5 border-chart-5/25",
  Solista: "bg-primary/15 text-primary border-primary/25",
};

function SocialIcon({ href, children }: { href?: string | null; children: React.ReactNode }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="flex size-8 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary hover:scale-110">
      {children}
    </a>
  );
}

function ArtistCard({ artist }: { artist: Artist }) {
  const whatsappUrl = `https://wa.me/57${artist.phone}`;
  const typeColor = TYPE_COLORS[artist.type] ?? "bg-muted text-muted-foreground";

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden">
        {artist.photo ? (
          <Image src={artist.photo} alt={artist.name} fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
        ) : (
          <div className="flex size-full items-center justify-center bg-muted text-muted-foreground text-4xl font-bold">
            {artist.name.charAt(0)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <Badge className={`absolute top-3 left-3 border ${typeColor}`}>{artist.type}</Badge>
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg font-bold text-white drop-shadow-md">{artist.name}</h3>
          <div className="flex items-center gap-1.5 text-sm text-white/80">
            <MapPin className="size-3.5" /><span>{artist.city}</span>
            <span className="mx-1">·</span><span>{artist.genre}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-foreground">{formatPrice(artist.price)}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3.5" />{artist.duration}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <SocialIcon href={artist.instagram}><InstagramIcon className="size-3.5" /></SocialIcon>
          <SocialIcon href={artist.tiktok}><TikTokIcon className="size-3.5" /></SocialIcon>
          <SocialIcon href={artist.youtube}><YoutubeIcon className="size-3.5" /></SocialIcon>
          <SocialIcon href={artist.spotify}><SpotifyIcon className="size-3.5" /></SocialIcon>
        </div>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-auto">
          <Button className="w-full gap-2 bg-[var(--whatsapp)] hover:bg-[var(--whatsapp-hover)] text-white font-semibold shadow-sm">
            <MessageCircle className="size-4" />Contactar
          </Button>
        </a>
      </div>
    </div>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
        active ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}>
      {label}{active && <X className="size-3" />}
    </button>
  );
}

export function CatalogoContent({ artists }: { artists: Artist[] }) {
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [genreFilter, setGenreFilter] = useState("all");

  const filtered = artists.filter((artist) => {
    const matchesSearch = artist.name.toLowerCase().includes(search.toLowerCase());
    const matchesCity = cityFilter === "all" || artist.city === cityFilter;
    const matchesType = typeFilter === "all" || artist.type === typeFilter;
    const matchesGenre = genreFilter === "all" || artist.genre === genreFilter;
    return matchesSearch && matchesCity && matchesType && matchesGenre;
  });

  const hasActiveFilters = cityFilter !== "all" || typeFilter !== "all" || genreFilter !== "all";
  function clearFilters() { setCityFilter("all"); setTypeFilter("all"); setGenreFilter("all"); setSearch(""); }

  return (
    <>
      {/* Hero */}
      <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary/10 via-background to-chart-2/10">
        <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
          <div className="flex flex-col items-center text-center gap-4">
            <Link href="/catalogo" className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Search className="size-5" />
              </div>
              <span className="text-2xl font-bold text-foreground">Apparta</span>
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Encuentra tu artista ideal</h1>
            <p className="text-muted-foreground max-w-md">Explora nuestro catálogo de artistas verificados en Colombia y contáctalos directamente</p>
            <div className="relative w-full max-w-lg mt-2">
              <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar artista por nombre..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="h-12 pl-12 text-base rounded-full border-border/50 bg-card shadow-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-10 border-b bg-card/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <span className="shrink-0 text-xs font-medium text-muted-foreground mr-1">Filtrar:</span>
            {cities.map((c) => (<FilterPill key={c} label={c} active={cityFilter === c} onClick={() => setCityFilter(cityFilter === c ? "all" : c)} />))}
            <div className="mx-1 h-4 w-px bg-border shrink-0" />
            {artistTypes.map((t) => (<FilterPill key={t} label={t} active={typeFilter === t} onClick={() => setTypeFilter(typeFilter === t ? "all" : t)} />))}
            <div className="mx-1 h-4 w-px bg-border shrink-0" />
            {genres.map((g) => (<FilterPill key={g} label={g} active={genreFilter === g} onClick={() => setGenreFilter(genreFilter === g ? "all" : g)} />))}
            {hasActiveFilters && (
              <><div className="mx-1 h-4 w-px bg-border shrink-0" />
              <button onClick={clearFilters} className="shrink-0 text-xs font-medium text-destructive hover:text-destructive/80 transition-colors">Limpiar filtros</button></>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-4"><p className="text-sm text-muted-foreground">{filtered.length} artista{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}</p></div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((artist) => (<ArtistCard key={artist.id} artist={artist} />))}
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted"><Search className="size-7 text-muted-foreground" /></div>
            <p className="mt-4 text-lg font-semibold text-foreground">No se encontraron artistas</p>
            <p className="text-sm text-muted-foreground mt-1">Intenta con otros filtros de búsqueda</p>
            {hasActiveFilters && <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>Limpiar filtros</Button>}
          </div>
        )}
      </main>
    </>
  );
}

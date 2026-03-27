"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  artists,
  cities,
  artistTypes,
  genres,
  formatPrice,
  type Artist,
} from "@/lib/data";
import {
  Search,
  MessageCircle,
  Clock,
  MapPin,
  ChevronDown,
} from "lucide-react";
import { InstagramIcon, YoutubeIcon, TikTokIcon, SpotifyIcon } from "@/components/social-icons";
import Image from "next/image";
import Link from "next/link";

function SocialIcon({ href, children }: { href?: string; children: React.ReactNode }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
    </a>
  );
}

function ArtistCard({ artist }: { artist: Artist }) {
  const whatsappUrl = `https://wa.me/57${artist.phone}`;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={artist.photo}
          alt={artist.name}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <Badge className="absolute top-3 left-3 bg-white/90 text-foreground backdrop-blur-sm hover:bg-white/90">
          {artist.type}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-semibold text-lg leading-tight">{artist.name}</h3>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{artist.city}</span>
            <span>·</span>
            <span>{artist.genre}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-foreground">
            {formatPrice(artist.price)}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {artist.duration}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <SocialIcon href={artist.instagram}>
            <InstagramIcon className="h-4 w-4" />
          </SocialIcon>
          <SocialIcon href={artist.tiktok}>
            <TikTokIcon className="h-4 w-4" />
          </SocialIcon>
          <SocialIcon href={artist.youtube}>
            <YoutubeIcon className="h-4 w-4" />
          </SocialIcon>
          <SocialIcon href={artist.spotify}>
            <SpotifyIcon className="h-4 w-4" />
          </SocialIcon>
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto"
        >
          <Button className="w-full gap-2 bg-[var(--whatsapp)] hover:bg-[var(--whatsapp-hover)] text-white font-semibold">
            <MessageCircle className="h-4 w-4" />
            Contactar
          </Button>
        </a>
      </div>
    </div>
  );
}

export default function CatalogoPage() {
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [genreFilter, setGenreFilter] = useState("all");

  const approvedArtists = artists.filter((a) => a.status === "Aprobado" && a.active);

  const filtered = approvedArtists.filter((artist) => {
    const matchesSearch = artist.name.toLowerCase().includes(search.toLowerCase());
    const matchesCity = cityFilter === "all" || artist.city === cityFilter;
    const matchesType = typeFilter === "all" || artist.type === typeFilter;
    const matchesGenre = genreFilter === "all" || artist.genre === genreFilter;
    return matchesSearch && matchesCity && matchesType && matchesGenre;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/catalogo" className="text-xl font-bold text-foreground">
            Apparta
          </Link>
          <h1 className="hidden text-sm font-medium text-muted-foreground md:block">
            Catálogo de Artistas
          </h1>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
              RE
            </div>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              Restaurante
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar artista..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 pl-10"
            />
          </div>
          <div className="flex gap-3">
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="h-11 w-[180px]">
                <SelectValue placeholder="Todas las ciudades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ciudades</SelectItem>
                {cities.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-11 w-[180px]">
                <SelectValue placeholder="Todas las profesiones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las profesiones</SelectItem>
                {artistTypes.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={genreFilter} onValueChange={setGenreFilter}>
              <SelectTrigger className="h-11 w-[180px]">
                <SelectValue placeholder="Todos los géneros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los géneros</SelectItem>
                {genres.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Search className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">
              No se encontraron artistas
            </p>
            <p className="text-sm text-muted-foreground/70">
              Intenta con otros filtros de búsqueda
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/data";
import type { Tables } from "@/lib/supabase/database.types";
import { approveArtist, rejectArtist } from "@/app/admin/actions";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle01Icon,
  CancelCircleIcon,
  Location01Icon,
  Clock01Icon,
  BubbleChatIcon,
} from "@hugeicons/core-free-icons";
import { InstagramIcon, YoutubeIcon, TikTokIcon, SpotifyIcon } from "@/components/social-icons";
import Image from "next/image";

type Artist = Tables<"artists">;

function SocialLink({ href, children }: { href?: string | null; children: React.ReactNode }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="text-muted-foreground hover:text-foreground transition-colors">
      {children}
    </a>
  );
}

function ArtistApprovalCard({ artist }: { artist: Artist }) {
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    startTransition(async () => {
      try {
        await approveArtist(artist.id);
        toast.success("Artista aprobado", { description: "Ahora aparecerá en el catálogo." });
      } catch {
        toast.error("Error al aprobar artista");
      }
    });
  }

  function handleReject() {
    startTransition(async () => {
      try {
        await rejectArtist(artist.id);
        toast.error("Artista rechazado", { description: "Se ha notificado al artista." });
      } catch {
        toast.error("Error al rechazar artista");
      }
    });
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-4 p-0 md:flex-row md:gap-0">
        <div className="relative h-48 w-full md:h-auto md:w-48 md:min-h-[220px] shrink-0">
          {artist.photo ? (
            <Image src={artist.photo} alt={artist.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 192px" />
          ) : (
            <div className="flex size-full items-center justify-center bg-muted text-4xl font-bold text-muted-foreground">{artist.name.charAt(0)}</div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold">{artist.name}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">{artist.type}</Badge>
                <span className="flex items-center gap-1"><HugeiconsIcon icon={Location01Icon} className="h-3.5 w-3.5" />{artist.city}</span>
                <span>·</span><span>{artist.genre}</span>
              </div>
            </div>
            <Badge className="bg-[var(--warning-bg)] text-[var(--warning)] hover:bg-[var(--warning-bg)]">Pendiente</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span className="flex items-center gap-1.5"><HugeiconsIcon icon={BubbleChatIcon} className="h-4 w-4 text-[var(--whatsapp)]" />+57 {artist.phone}</span>
            <span className="font-semibold text-foreground">{formatPrice(artist.price)}</span>
            <span className="flex items-center gap-1 text-muted-foreground"><HugeiconsIcon icon={Clock01Icon} className="h-3.5 w-3.5" />{artist.duration}</span>
          </div>
          <div className="flex items-center gap-3">
            <SocialLink href={artist.instagram}><InstagramIcon className="h-4 w-4" /></SocialLink>
            <SocialLink href={artist.tiktok}><TikTokIcon className="h-4 w-4" /></SocialLink>
            <SocialLink href={artist.youtube}><YoutubeIcon className="h-4 w-4" /></SocialLink>
            <SocialLink href={artist.spotify}><SpotifyIcon className="h-4 w-4" /></SocialLink>
          </div>
          <div className="flex items-center gap-3 pt-2 border-t">
            <Button onClick={handleApprove} disabled={isPending}
              className="gap-2 bg-[var(--success)] hover:bg-[var(--success-bg)] hover:text-[var(--success)] text-white">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-4 w-4" />Aprobar
            </Button>
            <Button onClick={handleReject} disabled={isPending} variant="outline"
              className="gap-2 text-destructive border-destructive/30 hover:bg-[var(--error-bg)]">
              <HugeiconsIcon icon={CancelCircleIcon} className="h-4 w-4" />Rechazar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AprobacionesContent({ artists }: { artists: Artist[] }) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Artistas Pendientes de Aprobación</h1>
        <p className="text-sm text-muted-foreground">{artists.length} solicitudes pendientes</p>
      </div>
      {artists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-12 w-12 text-[var(--success)]" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">Sin solicitudes pendientes</p>
          <p className="text-sm text-muted-foreground/70">Todas las solicitudes han sido revisadas</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {artists.map((artist) => (<ArtistApprovalCard key={artist.id} artist={artist} />))}
        </div>
      )}
    </div>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getMyArtistProfile } from "@/app/artista/actions";
import { ensureArtistProfile } from "@/lib/auth/ensure-artist";
import { formatPrice } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  InstagramIcon,
  YoutubeIcon,
  TikTokIcon,
  SpotifyIcon,
} from "@/components/social-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import {
  Location01Icon,
  Clock01Icon,
  PencilEdit01Icon,
  SmartPhone01Icon,
  MusicNote02Icon,
  MoneyBag02Icon,
  Globe02Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

/* ── Status badge mapping ────────────────────────────── */

const statusConfig: Record<string, { label: string; className: string }> = {
  Aprobado: {
    label: "Aprobado",
    className: "bg-[var(--success-bg)] text-[var(--success)] border-0",
  },
  Pendiente: {
    label: "Pendiente",
    className: "bg-[var(--warning-bg)] text-[var(--warning)] border-0",
  },
  Rechazado: {
    label: "Rechazado",
    className: "bg-[var(--error-bg)] text-[var(--error)] border-0",
  },
};

/* ── Social link component ───────────────────────────── */

function SocialLink({
  href,
  icon: Icon,
  label,
  color,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      className={cn(
        "flex size-10 items-center justify-center rounded-full transition-colors",
        "bg-[var(--elevated)] hover:bg-[var(--surface-3)]",
        color
      )}
    >
      <Icon className="size-5" />
    </a>
  );
}

/* ── Detail row component ────────────────────────────── */

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: IconSvgElement;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--elevated)]">
        <HugeiconsIcon icon={icon} className="size-4 text-[var(--text-muted)]" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────── */

export default async function ArtistaProfilePage() {
  // Never redirect to /login on a missing record: the session is valid, so
  // /login bounces straight back here and the browser loops. Pages render in
  // parallel with the layout, so this page has to self-heal on its own instead
  // of trusting the layout to have done it already.
  const artist = (await getMyArtistProfile()) ?? (await ensureArtistProfile());

  if (!artist) {
    notFound();
  }

  const status = statusConfig[artist.status ?? "Pendiente"] ?? statusConfig.Pendiente;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          Mi Perfil
        </h1>
        <Link href="/artista/editar">
          <Button className="gap-2 rounded-full">
            <HugeiconsIcon icon={PencilEdit01Icon} className="size-4" />
            Editar perfil
          </Button>
        </Link>
      </div>

      {/* Profile card */}
      <Card className="border-0 gradient-border-subtle bg-[var(--elevated)]">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:gap-6">
            {/* LEFT — Photo */}
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl md:aspect-auto md:w-80 lg:w-96">
              {artist.photo ? (
                <Image
                  src={artist.photo}
                  alt={artist.name}
                  fill
                  className="rounded-2xl object-cover"
                  sizes="(max-width: 768px) 100vw, 384px"
                  priority
                />
              ) : (
                <div className="flex size-full min-h-64 items-center justify-center rounded-2xl bg-[var(--surface-3)]">
                  <span className="text-7xl font-bold text-[var(--text-muted)]">
                    {artist.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* RIGHT — Details */}
            <div className="flex flex-1 flex-col gap-6">
              {/* Name + Status */}
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    {artist.name}
                  </h2>
                  <Badge variant="secondary" className={status.className}>
                    {status.label}
                  </Badge>
                </div>
                {artist.type && (
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {artist.type}
                  </p>
                )}
              </div>

              {/* Details grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                {artist.city && (
                  <DetailRow
                    icon={Location01Icon}
                    label="Ciudad"
                    value={artist.city}
                  />
                )}
                {artist.genre && (
                  <DetailRow
                    icon={MusicNote02Icon}
                    label="Genero"
                    value={artist.genre}
                  />
                )}
                {artist.price != null && artist.price > 0 && (
                  <DetailRow
                    icon={MoneyBag02Icon}
                    label="Tarifa"
                    value={formatPrice(artist.price)}
                  />
                )}
                {artist.duration && (
                  <DetailRow
                    icon={Clock01Icon}
                    label="Duracion"
                    value={artist.duration}
                  />
                )}
                {artist.phone && (
                  <DetailRow
                    icon={SmartPhone01Icon}
                    label="Telefono"
                    value={artist.phone}
                  />
                )}
              </div>

              {/* Social links */}
              {(artist.instagram || artist.tiktok || artist.youtube || artist.spotify || artist.website) && (
                <div>
                  <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[var(--text-muted)]">
                    Redes sociales
                  </p>
                  <div className="flex gap-3">
                    {artist.instagram && (
                      <SocialLink
                        href={artist.instagram}
                        icon={InstagramIcon}
                        label="Instagram"
                        color="text-[#E4405F]"
                      />
                    )}
                    {artist.tiktok && (
                      <SocialLink
                        href={artist.tiktok}
                        icon={TikTokIcon}
                        label="TikTok"
                        color="text-foreground"
                      />
                    )}
                    {artist.youtube && (
                      <SocialLink
                        href={artist.youtube}
                        icon={YoutubeIcon}
                        label="YouTube"
                        color="text-red-500"
                      />
                    )}
                    {artist.spotify && (
                      <SocialLink
                        href={artist.spotify}
                        icon={SpotifyIcon}
                        label="Spotify"
                        color="text-[#1DB954]"
                      />
                    )}
                    {artist.website && (
                      <SocialLink
                        href={artist.website}
                        icon={({ className }: { className?: string }) => (
                          <HugeiconsIcon icon={Globe02Icon} className={className} />
                        )}
                        label="Página Web"
                        color="text-blue-500"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

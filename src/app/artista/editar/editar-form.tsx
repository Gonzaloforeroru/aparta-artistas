"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cities, artistTypes, genres, DURATION_OPTIONS } from "@/lib/data";
import { updateMyArtistProfile } from "@/app/artista/actions";
import type { Artist } from "@/app/artista/actions";
import { HugeiconsIcon } from "@hugeicons/react";
import { Upload01Icon, BubbleChatIcon } from "@hugeicons/core-free-icons";
import {
  InstagramIcon,
  YoutubeIcon,
  TikTokIcon,
  SpotifyIcon,
} from "@/components/social-icons";

interface EditarFormProps {
  artist: Artist;
  mode: "editar" | "completar";
}

export function EditarForm({ artist, mode }: EditarFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    artist.photo ?? null
  );

  // Controlled state for Select components (base-ui Select doesn't send FormData via name prop)
  const [city, setCity] = useState<string>(artist.city ?? "");
  const [type, setType] = useState<string>(artist.type ?? "");
  const [genre, setGenre] = useState<string>(artist.genre ?? "");
  const [duration, setDuration] = useState<string>(artist.duration ?? "");

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPhotoPreview(URL.createObjectURL(file));
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateMyArtistProfile(formData);
      if (result.success) {
        toast.success("Perfil actualizado");
        router.refresh();
        router.push("/artista");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="w-full max-w-2xl">
      {/* Hidden inputs for Select values (base-ui Select doesn't submit FormData) */}
      <input type="hidden" name="city" value={city} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="genre" value={genre} />
      <input type="hidden" name="duration" value={duration} />

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Photo upload */}
        <Card className="h-fit">
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <Label className="text-sm font-medium">Foto de perfil</Label>
            <label className="flex h-48 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-primary/50 hover:bg-primary/5">
              {photoPreview ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="size-full rounded-lg object-cover"
                />
              ) : (
                <>
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                    <HugeiconsIcon
                      icon={Upload01Icon}
                      className="size-5 text-muted-foreground"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Subir foto</p>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG o WEBP hasta 5MB
                    </p>
                  </div>
                </>
              )}
              <input
                type="file"
                name="photo"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </label>
          </CardContent>
        </Card>

        {/* Fields */}
        <Card>
          <CardContent className="flex flex-col gap-6 p-6">
            {/* Datos principales */}
            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold">Datos Principales</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">
                    Nombre <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Nombre artístico o real"
                    defaultValue={artist.name ?? ""}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>
                    Ciudad <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={city}
                    onValueChange={(v) => setCity(v ?? "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>
                    Profesión <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={type}
                    onValueChange={(v) => setType(v ?? "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {artistTypes.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>
                    Género Musical <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={genre}
                    onValueChange={(v) => setGenre(v ?? "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {genres.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="price">Precio por presentación</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    placeholder="500000"
                    defaultValue={artist.price ?? ""}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Duración del show</Label>
                  <Select
                    value={duration}
                    onValueChange={(v) => setDuration(v ?? "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="phone">
                    Teléfono WhatsApp{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <HugeiconsIcon
                      icon={BubbleChatIcon}
                      className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--whatsapp)]"
                    />
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="310 123 4567"
                      className="pl-10"
                      defaultValue={artist.phone ?? ""}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Redes sociales */}
            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold text-muted-foreground">
                Redes Sociales (opcional)
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label className="flex items-center gap-1.5 text-muted-foreground">
                    <InstagramIcon className="h-3.5 w-3.5" /> Instagram
                  </Label>
                  <Input
                    name="instagram"
                    placeholder="https://instagram.com/..."
                    defaultValue={artist.instagram ?? ""}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="flex items-center gap-1.5 text-muted-foreground">
                    <TikTokIcon className="h-3.5 w-3.5" /> TikTok
                  </Label>
                  <Input
                    name="tiktok"
                    placeholder="https://tiktok.com/@..."
                    defaultValue={artist.tiktok ?? ""}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="flex items-center gap-1.5 text-muted-foreground">
                    <YoutubeIcon className="h-3.5 w-3.5" /> YouTube
                  </Label>
                  <Input
                    name="youtube"
                    placeholder="https://youtube.com/@..."
                    defaultValue={artist.youtube ?? ""}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="flex items-center gap-1.5 text-muted-foreground">
                    <SpotifyIcon className="h-3.5 w-3.5" /> Spotify
                  </Label>
                  <Input
                    name="spotify"
                    placeholder="https://open.spotify.com/..."
                    defaultValue={artist.spotify ?? ""}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex gap-3">
              {mode === "editar" && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1 font-semibold"
                  onClick={() => router.push("/artista")}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
              )}
              <Button
                type="submit"
                disabled={isPending}
                className="h-11 flex-1 font-semibold"
              >
                {isPending
                  ? "Guardando..."
                  : mode === "completar"
                    ? "Completar perfil"
                    : "Guardar cambios"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

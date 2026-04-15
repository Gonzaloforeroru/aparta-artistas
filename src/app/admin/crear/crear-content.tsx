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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cities, artistTypes, genres } from "@/lib/data";
import type { Tables } from "@/lib/supabase/database.types";
import { createArtist, updateArtist } from "@/app/admin/actions";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Upload01Icon, BubbleChatIcon } from "@hugeicons/core-free-icons";
import { InstagramIcon, YoutubeIcon, TikTokIcon, SpotifyIcon } from "@/components/social-icons";
import Link from "next/link";

type Artist = Tables<"artists">;

export function CrearContent({ existingArtist }: { existingArtist: Artist | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [photoPreview, setPhotoPreview] = useState<string | null>(existingArtist?.photo ?? null);
  const isEditing = !!existingArtist;

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPhotoPreview(URL.createObjectURL(file));
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        if (isEditing) {
          await updateArtist(existingArtist.id, formData);
          toast.success("Artista actualizado exitosamente");
        } else {
          await createArtist(formData);
          toast.success("Artista creado exitosamente");
        }
        router.push("/admin/lista");
      } catch {
        toast.error("Error al guardar artista");
      }
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button nativeButton={false} render={<Link href="/admin/lista" />} variant="ghost" size="icon">
          <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isEditing ? "Editar Artista" : "Crear Nuevo Artista"}</h1>
          <p className="text-sm text-muted-foreground">{isEditing ? "Modifica la información del artista" : "Completa la información del artista"}</p>
        </div>
      </div>

      <form action={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
           <Card className="h-fit gradient-border-subtle">
            <CardContent className="flex flex-col items-center gap-4 p-6">
              <Label className="text-sm font-medium">Foto de perfil</Label>
              <label className="flex h-48 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-muted-foreground/50">
                {photoPreview ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={photoPreview} alt="Preview" className="size-full rounded-lg object-cover" />
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <HugeiconsIcon icon={Upload01Icon} className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Subir foto</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG hasta 5MB</p>
                    </div>
                  </>
                )}
                <input type="file" name="photo" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
            </CardContent>
          </Card>

           <Card className="gradient-border-subtle">
            <CardContent className="flex flex-col gap-6 p-6">
              <div className="flex flex-col gap-4">
                <p className="text-sm font-semibold">Datos Principales</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="name">Nombre <span className="text-destructive">*</span></Label>
                    <Input id="name" name="name" placeholder="Nombre artístico o real" defaultValue={existingArtist?.name ?? ""} required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Ciudad <span className="text-destructive">*</span></Label>
                    <Select name="city" defaultValue={existingArtist?.city ?? ""} required>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>{cities.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Profesión <span className="text-destructive">*</span></Label>
                    <Select name="type" defaultValue={existingArtist?.type ?? ""} required>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>{artistTypes.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Género Musical <span className="text-destructive">*</span></Label>
                    <Select name="genre" defaultValue={existingArtist?.genre ?? ""} required>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>{genres.map((g) => (<SelectItem key={g} value={g}>{g}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="phone">WhatsApp <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <HugeiconsIcon icon={BubbleChatIcon} className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--whatsapp)]" />
                      <Input id="phone" name="phone" placeholder="310 123 4567" className="pl-10" defaultValue={existingArtist?.phone ?? ""} required />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="price">Precio</Label>
                    <Input id="price" name="price" type="number" placeholder="500000" defaultValue={existingArtist?.price ?? ""} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="duration">Duración del show</Label>
                    <Input id="duration" name="duration" placeholder="Ej: 2 horas" defaultValue={existingArtist?.duration ?? ""} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Estado</Label>
                    <Select name="status" defaultValue={existingArtist?.status ?? "Aprobado"}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendiente">Pendiente</SelectItem>
                        <SelectItem value="Aprobado">Aprobado</SelectItem>
                        <SelectItem value="Rechazado">Rechazado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex flex-col gap-4">
                <p className="text-sm font-semibold text-muted-foreground">Redes Sociales (opcional)</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label className="flex items-center gap-1.5 text-muted-foreground"><InstagramIcon className="h-3.5 w-3.5" /> Instagram</Label>
                    <Input name="instagram" placeholder="https://instagram.com/..." defaultValue={existingArtist?.instagram ?? ""} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="flex items-center gap-1.5 text-muted-foreground"><TikTokIcon className="h-3.5 w-3.5" /> TikTok</Label>
                    <Input name="tiktok" placeholder="https://tiktok.com/@..." defaultValue={existingArtist?.tiktok ?? ""} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="flex items-center gap-1.5 text-muted-foreground"><YoutubeIcon className="h-3.5 w-3.5" /> YouTube</Label>
                    <Input name="youtube" placeholder="https://youtube.com/@..." defaultValue={existingArtist?.youtube ?? ""} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="flex items-center gap-1.5 text-muted-foreground"><SpotifyIcon className="h-3.5 w-3.5" /> Spotify</Label>
                    <Input name="spotify" placeholder="https://open.spotify.com/..." defaultValue={existingArtist?.spotify ?? ""} />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-end gap-3">
                <Button nativeButton={false} render={<Link href="/admin/lista" />} variant="outline">Cancelar</Button>
                <Button type="submit" disabled={isPending}>{isPending ? "Guardando..." : isEditing ? "Actualizar" : "Guardar"}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}

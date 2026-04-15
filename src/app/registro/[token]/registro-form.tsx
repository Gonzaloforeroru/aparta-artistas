"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cities, artistTypes, genres } from "@/lib/data";
import { HugeiconsIcon } from "@hugeicons/react";
import { Upload01Icon, BubbleChatIcon, MusicNote02Icon } from "@hugeicons/core-free-icons";
import { InstagramIcon, YoutubeIcon, TikTokIcon, SpotifyIcon } from "@/components/social-icons";
import { registerArtistWithToken } from "@/app/admin/actions";

export function RegistroForm({ token }: { token: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPhotoPreview(URL.createObjectURL(file));
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await registerArtistWithToken(token, formData);
        toast.success("¡Solicitud enviada!", { description: "Tu perfil será revisado por un administrador." });
        router.push("/registro/exito");
      } catch {
        toast.error("Error al enviar la solicitud. Intenta de nuevo.");
      }
    });
  }

  return (
    <div className="w-full max-w-[560px]">
      <div className="mb-8 flex flex-col items-center gap-1">
        <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <HugeiconsIcon icon={MusicNote02Icon} className="size-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Apparta</h1>
        <h2 className="text-xl font-semibold text-foreground">Registro de Artista</h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Completa tus datos para aparecer en nuestro catálogo de artistas
        </p>
      </div>

      <Card className="glass-card border-0 shadow-lg">
        <CardContent className="p-8">
          <form action={handleSubmit} className="flex flex-col gap-6">
            {/* Foto */}
            <div>
              <Label className="text-sm font-medium">Foto de perfil</Label>
              <label className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 transition-colors hover:border-primary/50 hover:bg-primary/5">
                {photoPreview ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={photoPreview} alt="Preview" className="size-24 rounded-full object-cover" />
                ) : (
                  <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                    <HugeiconsIcon icon={Upload01Icon} className="size-6 text-muted-foreground" />
                  </div>
                )}
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">{photoPreview ? "Cambiar foto" : "Haz clic para subir foto"}</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG o WEBP hasta 5MB</p>
                </div>
                <input type="file" name="photo" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
            </div>

            <Separator />

            {/* Info personal */}
            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold text-foreground">Información Personal</p>
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Nombre <span className="text-destructive">*</span></Label>
                <Input id="name" name="name" placeholder="Tu nombre artístico o real" className="h-11" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Ciudad <span className="text-destructive">*</span></Label>
                <Select name="city" required>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Selecciona tu ciudad" /></SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Info profesional */}
            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold text-foreground">Información Profesional</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Profesión <span className="text-destructive">*</span></Label>
                  <Select name="type" required>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                    <SelectContent>
                      {artistTypes.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Género Musical <span className="text-destructive">*</span></Label>
                  <Select name="genre" required>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                    <SelectContent>
                      {genres.map((g) => (<SelectItem key={g} value={g}>{g}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="price">Precio por presentación</Label>
                  <Input id="price" name="price" type="number" placeholder="500000" className="h-11" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="duration">Duración del show</Label>
                  <Input id="duration" name="duration" placeholder="Ej: 2 horas" className="h-11" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Contacto */}
            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold text-foreground">Contacto</p>
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Teléfono WhatsApp <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <HugeiconsIcon icon={BubbleChatIcon} className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--whatsapp)]" />
                  <Input id="phone" name="phone" placeholder="310 123 4567" className="h-11 pl-10" required />
                </div>
              </div>
            </div>

            <Separator />

            {/* Redes */}
            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold text-muted-foreground">Redes Sociales (opcional)</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label className="flex items-center gap-1.5 text-muted-foreground"><InstagramIcon className="h-3.5 w-3.5" /> Instagram</Label>
                  <Input name="instagram" placeholder="https://instagram.com/..." className="h-11" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="flex items-center gap-1.5 text-muted-foreground"><TikTokIcon className="h-3.5 w-3.5" /> TikTok</Label>
                  <Input name="tiktok" placeholder="https://tiktok.com/@..." className="h-11" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="flex items-center gap-1.5 text-muted-foreground"><YoutubeIcon className="h-3.5 w-3.5" /> YouTube</Label>
                  <Input name="youtube" placeholder="https://youtube.com/@..." className="h-11" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="flex items-center gap-1.5 text-muted-foreground"><SpotifyIcon className="h-3.5 w-3.5" /> Spotify</Label>
                  <Input name="spotify" placeholder="https://open.spotify.com/..." className="h-11" />
                </div>
              </div>
            </div>

            <Button type="submit" disabled={isPending} className="mt-2 h-12 w-full text-base font-semibold">
              {isPending ? "Enviando..." : "Enviar Solicitud"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">Tu perfil será revisado por un administrador antes de ser publicado.</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

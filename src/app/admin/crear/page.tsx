"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { cities, artistTypes, genres, artists } from "@/lib/data";
import {
  ArrowLeft,
  Upload,
  MessageCircle,
} from "lucide-react";
import { InstagramIcon, YoutubeIcon, TikTokIcon, SpotifyIcon } from "@/components/social-icons";
import Link from "next/link";

function AdminCrearContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const existingArtist = editId ? artists.find(a => a.id === editId) : null;
  const isEditing = !!existingArtist;

  const [name, setName] = useState(existingArtist?.name ?? "");
  const [city, setCity] = useState(existingArtist?.city ?? "");
  const [type, setType] = useState(existingArtist?.type ?? "");
  const [genre, setGenre] = useState(existingArtist?.genre ?? "");
  const [phone, setPhone] = useState(existingArtist?.phone ?? "");
  const [price, setPrice] = useState(existingArtist?.price?.toString() ?? "");
  const [duration, setDuration] = useState(existingArtist?.duration ?? "");
  const [status, setStatus] = useState(existingArtist?.status ?? "Pendiente");
  const [instagram, setInstagram] = useState(existingArtist?.instagram ?? "");
  const [tiktok, setTiktok] = useState(existingArtist?.tiktok ?? "");
  const [youtube, setYoutube] = useState(existingArtist?.youtube ?? "");
  const [spotify, setSpotify] = useState(existingArtist?.spotify ?? "");

  const handleSave = () => {
    toast.success(isEditing ? "Artista actualizado exitosamente" : "Artista creado exitosamente", {
      description: isEditing ? "Los cambios han sido guardados." : "El artista ha sido agregado al directorio.",
    });
    setTimeout(() => router.push("/admin/lista"), 1500);
  };
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/lista">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
         <div>
           <h1 className="text-2xl font-bold tracking-tight">{isEditing ? "Editar Artista" : "Crear Nuevo Artista"}</h1>
           <p className="text-sm text-muted-foreground">
             {isEditing ? "Modifica la información del artista" : "Completa la información del artista"}
           </p>
         </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit">
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <Label className="text-sm font-medium">
              Foto de perfil <span className="text-destructive">*</span>
            </Label>
            <div className="flex h-48 w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-muted-foreground/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Subir foto</p>
                <p className="text-xs text-muted-foreground">JPG, PNG hasta 5MB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold">Datos Principales</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                   <Label htmlFor="name">
                     Nombre <span className="text-destructive">*</span>
                   </Label>
                   <Input
                     id="name"
                     placeholder="Nombre artístico o real"
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                   />
                 </div>
                <div className="flex flex-col gap-2">
                   <Label>
                     Ciudad <span className="text-destructive">*</span>
                   </Label>
                   <Select value={city} onValueChange={(value: string) => setCity(value || "")}>
                     <SelectTrigger>
                       <SelectValue placeholder="Seleccionar" />
                     </SelectTrigger>
                     <SelectContent>
                       {cities.map((c) => (
                         <SelectItem key={c} value={c}>{c}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                <div className="flex flex-col gap-2">
                   <Label>
                     Profesión <span className="text-destructive">*</span>
                   </Label>
                   <Select value={type} onValueChange={(value: string) => setType(value || "")}>
                     <SelectTrigger>
                       <SelectValue placeholder="Seleccionar" />
                     </SelectTrigger>
                     <SelectContent>
                       {artistTypes.map((t) => (
                         <SelectItem key={t} value={t}>{t}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                <div className="flex flex-col gap-2">
                   <Label>
                     Género Musical <span className="text-destructive">*</span>
                   </Label>
                   <Select value={genre} onValueChange={(value: string) => setGenre(value || "")}>
                     <SelectTrigger>
                       <SelectValue placeholder="Seleccionar" />
                     </SelectTrigger>
                     <SelectContent>
                       {genres.map((g) => (
                         <SelectItem key={g} value={g}>{g}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                <div className="flex flex-col gap-2">
                   <Label htmlFor="phone">
                     WhatsApp <span className="text-destructive">*</span>
                   </Label>
                   <div className="relative">
                     <MessageCircle className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--whatsapp)]" />
                     <Input
                       id="phone"
                       placeholder="310 123 4567"
                       className="pl-10"
                       value={phone}
                       onChange={(e) => setPhone(e.target.value)}
                     />
                   </div>
                 </div>
                <div className="flex flex-col gap-2">
                   <Label htmlFor="price">Precio</Label>
                   <Input
                     id="price"
                     type="number"
                     placeholder="500000"
                     value={price}
                     onChange={(e) => setPrice(e.target.value)}
                   />
                 </div>
                <div className="flex flex-col gap-2">
                   <Label htmlFor="duration">Duración del show</Label>
                   <Input
                     id="duration"
                     placeholder="Ej: 2 horas"
                     value={duration}
                     onChange={(e) => setDuration(e.target.value)}
                   />
                 </div>
                <div className="flex flex-col gap-2">
                   <Label>Estado</Label>
                   <Select value={status} onValueChange={(value: string) => setStatus((value || "Pendiente") as "Aprobado" | "Pendiente" | "Rechazado")}>
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
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
              <p className="text-sm font-semibold text-muted-foreground">
                Redes Sociales (opcional)
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                   <Label className="flex items-center gap-1.5 text-muted-foreground">
                     <InstagramIcon className="h-3.5 w-3.5" /> Instagram
                   </Label>
                   <Input
                     placeholder="https://instagram.com/..."
                     value={instagram}
                     onChange={(e) => setInstagram(e.target.value)}
                   />
                 </div>
                <div className="flex flex-col gap-2">
                   <Label className="flex items-center gap-1.5 text-muted-foreground">
                     <TikTokIcon className="h-3.5 w-3.5" /> TikTok
                   </Label>
                   <Input
                     placeholder="https://tiktok.com/@..."
                     value={tiktok}
                     onChange={(e) => setTiktok(e.target.value)}
                   />
                 </div>
                <div className="flex flex-col gap-2">
                   <Label className="flex items-center gap-1.5 text-muted-foreground">
                     <YoutubeIcon className="h-3.5 w-3.5" /> YouTube
                   </Label>
                   <Input
                     placeholder="https://youtube.com/@..."
                     value={youtube}
                     onChange={(e) => setYoutube(e.target.value)}
                   />
                 </div>
                <div className="flex flex-col gap-2">
                   <Label className="flex items-center gap-1.5 text-muted-foreground">
                     <SpotifyIcon className="h-3.5 w-3.5" /> Spotify
                   </Label>
                   <Input
                     placeholder="https://open.spotify.com/..."
                     value={spotify}
                     onChange={(e) => setSpotify(e.target.value)}
                   />
                 </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-end gap-3">
              <Button asChild variant="outline">
                <Link href="/admin/lista">Cancelar</Link>
              </Button>
               <Button
                 className="bg-primary hover:bg-primary/90 text-primary-foreground"
                 onClick={handleSave}
               >
                 {isEditing ? "Actualizar" : "Guardar"}
               </Button>
            </div>
          </CardContent>
         </Card>
       </div>
     </div>
   );
}

export default function AdminCrearPage() {
  return (
    <Suspense fallback={<div className="flex flex-1 items-center justify-center p-6">Cargando...</div>}>
      <AdminCrearContent />
    </Suspense>
  );
}

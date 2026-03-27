"use client";

import { useState } from "react";
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
import { Upload, MessageCircle } from "lucide-react";
import { InstagramIcon, YoutubeIcon, TikTokIcon, SpotifyIcon } from "@/components/social-icons";
import Link from "next/link";

export default function RegistroPage() {
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [artistType, setArtistType] = useState("");
  const [genre, setGenre] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [youtube, setYoutube] = useState("");
  const [spotify, setSpotify] = useState("");

  const handleSubmit = () => {
    toast.success("¡Solicitud enviada!", {
      description: "Tu perfil será revisado por un administrador.",
    });
    
    setName("");
    setCity("");
    setArtistType("");
    setGenre("");
    setPrice("");
    setDuration("");
    setPhone("");
    setInstagram("");
    setTiktok("");
    setYoutube("");
    setSpotify("");
    
    setTimeout(() => {
      router.push("/login");
    }, 2000);
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-background px-4 py-12">
      <div className="w-full max-w-[560px]">
        <div className="mb-8 flex flex-col items-center gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Apparta
          </h1>
          <h2 className="text-xl font-semibold text-foreground">
            Registro de Artista
          </h2>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Completa tus datos para aparecer en nuestro catálogo de artistas
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="flex flex-col gap-6 p-8">
            <div>
              <Label className="text-sm font-medium">
                Foto de perfil <span className="text-destructive">*</span>
              </Label>
              <div className="mt-2 flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 transition-colors hover:border-muted-foreground/50">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Haz clic para subir foto
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG o WEBP hasta 5MB
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold text-foreground">
                Información Personal
              </p>
               <div className="flex flex-col gap-2">
                 <Label htmlFor="name">
                   Nombre <span className="text-destructive">*</span>
                 </Label>
                 <Input 
                   id="name" 
                   placeholder="Tu nombre artístico o real" 
                   className="h-11"
                   value={name}
                   onChange={(e) => setName(e.target.value)}
                 />
               </div>
               <div className="flex flex-col gap-2">
                 <Label htmlFor="city">
                   Ciudad <span className="text-destructive">*</span>
                 </Label>
                 <Select value={city} onValueChange={(value) => setCity(value || "")}>
                   <SelectTrigger className="h-11">
                     <SelectValue placeholder="Selecciona tu ciudad" />
                   </SelectTrigger>
                   <SelectContent>
                     {cities.map((c) => (
                       <SelectItem key={c} value={c}>{c}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold text-foreground">
                Información Profesional
              </p>
              <div className="grid grid-cols-2 gap-4">
                 <div className="flex flex-col gap-2">
                   <Label>
                     Profesión <span className="text-destructive">*</span>
                   </Label>
                   <Select value={artistType} onValueChange={(value) => setArtistType(value || "")}>
                     <SelectTrigger className="h-11">
                       <SelectValue placeholder="Selecciona" />
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
                   <Select value={genre} onValueChange={(value) => setGenre(value || "")}>
                     <SelectTrigger className="h-11">
                       <SelectValue placeholder="Selecciona" />
                     </SelectTrigger>
                     <SelectContent>
                       {genres.map((g) => (
                         <SelectItem key={g} value={g}>{g}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="flex flex-col gap-2">
                   <Label htmlFor="price">Precio por presentación</Label>
                   <Input 
                     id="price" 
                     type="number" 
                     placeholder="500000" 
                     className="h-11"
                     value={price}
                     onChange={(e) => setPrice(e.target.value)}
                   />
                 </div>
                 <div className="flex flex-col gap-2">
                   <Label htmlFor="duration">Duración del show</Label>
                   <Input 
                     id="duration" 
                     placeholder="Ej: 2 horas" 
                     className="h-11"
                     value={duration}
                     onChange={(e) => setDuration(e.target.value)}
                   />
                 </div>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold text-foreground">Contacto</p>
               <div className="flex flex-col gap-2">
                 <Label htmlFor="phone">
                   Teléfono WhatsApp <span className="text-destructive">*</span>
                 </Label>
                 <div className="relative">
                   <MessageCircle className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--whatsapp)]" />
                   <Input 
                     id="phone" 
                     placeholder="310 123 4567" 
                     className="h-11 pl-10"
                     value={phone}
                     onChange={(e) => setPhone(e.target.value)}
                   />
                 </div>
               </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold text-muted-foreground">
                Redes Sociales (opcional)
              </p>
              <div className="grid grid-cols-2 gap-4">
                 <div className="flex flex-col gap-2">
                   <Label className="flex items-center gap-1.5 text-muted-foreground">
                     <InstagramIcon className="h-3.5 w-3.5" /> Instagram
                   </Label>
                   <Input 
                     placeholder="https://instagram.com/..." 
                     className="h-11"
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
                     className="h-11"
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
                     className="h-11"
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
                     className="h-11"
                     value={spotify}
                     onChange={(e) => setSpotify(e.target.value)}
                   />
                 </div>
              </div>
            </div>

            <Button 
              onClick={handleSubmit}
              className="mt-2 h-12 w-full text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Enviar Solicitud
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Tu perfil será revisado por un administrador antes de ser publicado.
            </p>
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-sm">
          <span className="text-muted-foreground">¿Ya tienes cuenta?</span>
          <Link
            href="/login"
            className="font-semibold text-primary hover:text-primary/80"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}

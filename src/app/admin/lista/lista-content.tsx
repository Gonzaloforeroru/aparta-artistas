"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cities, artistTypes, formatPrice } from "@/lib/data";
import type { Tables, ArtistStatus } from "@/lib/supabase/database.types";
import { deleteArtist, toggleArtistActive } from "@/app/admin/actions";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon, Add01Icon, PencilEdit01Icon, Delete02Icon,
  ToggleOffIcon, ToggleOnIcon, Upload01Icon, Mail01Icon,
} from "@hugeicons/core-free-icons";
import Image from "next/image";
import Link from "next/link";

type Artist = Tables<"artists">;

function StatusBadge({ status }: { status: ArtistStatus }) {
  const variants: Record<ArtistStatus, { className: string }> = {
    Aprobado: { className: "bg-[var(--success-bg)] text-[var(--success)] hover:bg-[var(--success-bg)]" },
    Pendiente: { className: "bg-[var(--warning-bg)] text-[var(--warning)] hover:bg-[var(--warning-bg)]" },
    Rechazado: { className: "bg-[var(--error-bg)] text-[var(--error)] hover:bg-[var(--error-bg)]" },
  };
  return (<Badge variant="secondary" className={variants[status].className}>{status}</Badge>);
}

export function ListaContent({ artists }: { artists: Artist[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const perPage = 10;

  const filtered = artists.filter((artist) => {
    const matchesSearch = artist.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || artist.type === typeFilter;
    const matchesCity = cityFilter === "all" || artist.city === cityFilter;
    const matchesStatus = statusFilter === "all" || artist.status === statusFilter;
    return matchesSearch && matchesType && matchesCity && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
  const artistToDelete = artists.find((a) => a.id === deleteTarget);
  const rangeStart = filtered.length > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const rangeEnd = Math.min(currentPage * perPage, filtered.length);

  function handleToggle(id: string, currentActive: boolean) {
    startTransition(async () => {
      try {
        await toggleArtistActive(id, !currentActive);
        toast.success("Estado actualizado");
      } catch { toast.error("Error al actualizar"); }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteArtist(id);
        setDeleteTarget(null);
        toast.success("Artista eliminado");
      } catch { toast.error("Error al eliminar"); }
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Artistas</h1>
          <p className="text-sm text-muted-foreground">{artists.length} artistas en total</p>
        </div>
        <div className="flex items-center gap-2">
          <Button nativeButton={false} render={<Link href="/admin/importar" />} variant="outline" size="sm" className="gap-2">
            <HugeiconsIcon icon={Upload01Icon} className="h-4 w-4" /><span className="hidden sm:inline">Importar CSV</span>
          </Button>
          <Button nativeButton={false} render={<Link href="/admin/invitaciones" />} variant="outline" size="sm" className="gap-2">
            <HugeiconsIcon icon={Mail01Icon} className="h-4 w-4" /><span className="hidden sm:inline">Invitar Artista</span>
          </Button>
          <Button nativeButton={false} render={<Link href="/admin/crear" />} size="sm" className="gap-2">
            <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />Nuevo Artista
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nombre..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
        </div>
        <div className="flex gap-3">
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v ?? "all"); setPage(1); }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Profesión" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las profesiones</SelectItem>
              {artistTypes.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={cityFilter} onValueChange={(v) => { setCityFilter(v ?? "all"); setPage(1); }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Ciudad" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las ciudades</SelectItem>
              {cities.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? "all"); setPage(1); }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Aprobado">Aprobado</SelectItem>
              <SelectItem value="Pendiente">Pendiente</SelectItem>
              <SelectItem value="Rechazado">Rechazado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl bg-card p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Foto</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Profesión</TableHead>
              <TableHead>Género</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((artist) => (
              <TableRow key={artist.id}>
                <TableCell>
                  <div className="relative h-10 w-10 overflow-hidden rounded-full">
                    {artist.photo ? (
                      <Image src={artist.photo} alt={artist.name} fill className="object-cover" sizes="40px" />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-muted text-sm font-bold text-muted-foreground">{artist.name.charAt(0)}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{artist.name}</TableCell>
                <TableCell>{artist.type}</TableCell>
                <TableCell>{artist.genre}</TableCell>
                <TableCell>{artist.city}</TableCell>
                <TableCell>{formatPrice(artist.price)}</TableCell>
                <TableCell><StatusBadge status={artist.status} /></TableCell>
                 <TableCell>
                   <div className="flex items-center justify-end gap-1">
                     <Button nativeButton={false} render={<Link href={`/admin/crear?id=${artist.id}`} />} variant="ghost" size="icon" className="h-8 w-8">
                       <HugeiconsIcon icon={PencilEdit01Icon} className="h-4 w-4" />
                     </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(artist.id)} disabled={isPending}>
                      <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"
                      onClick={() => handleToggle(artist.id, artist.active)} disabled={isPending}>
                      {artist.active ? (<HugeiconsIcon icon={ToggleOnIcon} className="h-4 w-4 text-[var(--success)]" />) : (<HugeiconsIcon icon={ToggleOffIcon} className="h-4 w-4 text-muted-foreground" />)}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Mostrando {rangeStart}–{rangeEnd} de {filtered.length} artistas</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>← Anterior</Button>
          <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Siguiente →</Button>
        </div>
      </div>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar artista?</AlertDialogTitle>
            <AlertDialogDescription>
              {artistToDelete ? `Se desactivará a "${artistToDelete.name}". Podrá restaurarse después.` : "Esta acción desactivará al artista."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => deleteTarget && handleDelete(deleteTarget)} disabled={isPending}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  artists,
  cities,
  artistTypes,
  formatPrice,
  type ArtistStatus,
} from "@/lib/data";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function StatusBadge({ status }: { status: ArtistStatus }) {
  const variants: Record<ArtistStatus, { className: string }> = {
    Aprobado: { className: "bg-[var(--success-bg)] text-[var(--success)] hover:bg-[var(--success-bg)]" },
    Pendiente: { className: "bg-[var(--warning-bg)] text-[var(--warning)] hover:bg-[var(--warning-bg)]" },
    Rechazado: { className: "bg-[var(--error-bg)] text-[var(--error)] hover:bg-[var(--error-bg)]" },
  };

  return (
    <Badge variant="secondary" className={variants[status].className}>
      {status}
    </Badge>
  );
}

export default function AdminListaPage() {
  const [localArtists, setLocalArtists] = useState([...artists]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const perPage = 10;

  const filtered = localArtists.filter((artist) => {
    const matchesSearch = artist.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || artist.type === typeFilter;
    const matchesCity = cityFilter === "all" || artist.city === cityFilter;
    const matchesStatus = statusFilter === "all" || artist.status === statusFilter;
    return matchesSearch && matchesType && matchesCity && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const paginatedFiltered = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
  const artistToDelete = localArtists.find((a) => a.id === deleteTarget);

  const rangeStart = filtered.length > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const rangeEnd = Math.min(currentPage * perPage, filtered.length);

  function handleToggle(id: string) {
    setLocalArtists((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
    toast.success("Estado actualizado");
  }

  function handleDelete(id: string) {
    setLocalArtists((prev) => prev.filter((a) => a.id !== id));
    setDeleteTarget(null);
    toast.success("Artista eliminado");
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Artistas</h1>
          <p className="text-sm text-muted-foreground">
            {localArtists.length} artistas en total
          </p>
        </div>
        <Button asChild className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href="/admin/crear">
            <Plus className="h-4 w-4" />
            Nuevo Artista
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10"
          />
        </div>
        <div className="flex gap-3">
          <Select value={typeFilter} onValueChange={(v: string) => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Profesión" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las profesiones</SelectItem>
              {artistTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={cityFilter} onValueChange={(v: string) => { setCityFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Ciudad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las ciudades</SelectItem>
              {cities.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v: string) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Aprobado">Aprobado</SelectItem>
              <SelectItem value="Pendiente">Pendiente</SelectItem>
              <SelectItem value="Rechazado">Rechazado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
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
            {paginatedFiltered.map((artist) => (
              <TableRow key={artist.id}>
                <TableCell>
                  <div className="relative h-10 w-10 overflow-hidden rounded-full">
                    <Image
                      src={artist.photo}
                      alt={artist.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                </TableCell>
                <TableCell className="font-medium">{artist.name}</TableCell>
                <TableCell>{artist.type}</TableCell>
                <TableCell>{artist.genre}</TableCell>
                <TableCell>{artist.city}</TableCell>
                <TableCell>{formatPrice(artist.price)}</TableCell>
                <TableCell>
                  <StatusBadge status={artist.status} />
                </TableCell>
                 <TableCell>
                   <div className="flex items-center justify-end gap-1">
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                        <Link href={`/admin/crear?id=${artist.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(artist.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggle(artist.id)}
                    >
                      {artist.active ? (
                        <ToggleRight className="h-4 w-4 text-[var(--success)]" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Mostrando {rangeStart}–{rangeEnd} de {filtered.length} artistas
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Anterior
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant="outline"
              size="sm"
              className={p === currentPage ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
              onClick={() => setPage(p)}
            >
              {p}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Siguiente →
          </Button>
        </div>
      </div>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar artista?</AlertDialogTitle>
            <AlertDialogDescription>
              {artistToDelete
                ? `Se eliminará a "${artistToDelete.name}". Esta acción no se puede deshacer.`
                : "Esta acción no se puede deshacer."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

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
import { cities, formatPrice } from "@/lib/data";
import type { Tables, ArtistStatus } from "@/lib/supabase/database.types";
import { deleteArtist, toggleArtistActive, updateArtistAssociation } from "@/app/admin/actions";
import type { Association } from "@/lib/queries/associations";
import type { Tag } from "@/lib/queries/tags";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon, Add01Icon, PencilEdit01Icon, Delete02Icon,
  ToggleOffIcon, ToggleOnIcon, Upload01Icon, Mail01Icon,
  UserGroupIcon,
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

interface ListaContentProps {
  artists: Artist[];
  associations: Association[];
  typeOptions: Tag[];
}

export function ListaContent({ artists, associations, typeOptions }: ListaContentProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [assocTarget, setAssocTarget] = useState<Artist | null>(null);
  const [selectedAssocId, setSelectedAssocId] = useState<string>("none");
  const [isPending, startTransition] = useTransition();
  const perPage = 10;

  const activeAssociations = associations.filter((a) => a.active);

  /** Mapa para resolución rápida de association_id → nombre/sigla */
  const assocMap = new Map(associations.map((a) => [a.id, a]));

  function openAssocDialog(artist: Artist) {
    setAssocTarget(artist);
    setSelectedAssocId(artist.association_id ?? "none");
  }

  function handleAssocSave() {
    if (!assocTarget) return;
    const artist = assocTarget;
    const newId = selectedAssocId !== "none" ? selectedAssocId : null;
    startTransition(async () => {
      const result = await updateArtistAssociation(artist.id, newId);
      if (result.success) {
        toast.success("Asociación actualizada");
      } else {
        toast.error(result.error);
      }
      setAssocTarget(null);
    });
  }

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
              {/*
                El Select de Base UI pinta el VALOR crudo cuando <SelectValue />
                va sin hijos: estos tres filtros mostraban literalmente "all".
                Se les pasa el texto explicito.
              */}
              <SelectTrigger className="w-[160px]">
                <SelectValue>
                  {typeFilter === "all" ? "Profesión" : typeFilter}
                </SelectValue>
              </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las profesiones</SelectItem>
              {typeOptions.map((t) => (<SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={cityFilter} onValueChange={(v) => { setCityFilter(v ?? "all"); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue>
                  {cityFilter === "all" ? "Ciudad" : cityFilter}
                </SelectValue>
              </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las ciudades</SelectItem>
              {cities.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? "all"); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue>
                  {statusFilter === "all" ? "Estado" : statusFilter}
                </SelectValue>
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
              <TableHead>Asociación</TableHead>
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
                <TableCell>
                  {artist.association_id ? (
                    <Badge
                      variant="secondary"
                      className="cursor-pointer text-xs"
                      onClick={() => openAssocDialog(artist)}
                    >
                      {(() => {
                        const a = assocMap.get(artist.association_id);
                        return a ? (a.shortName ?? a.name) : "—";
                      })()}
                    </Badge>
                  ) : (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors"
                      onClick={() => openAssocDialog(artist)}
                    >
                      Asignar
                    </button>
                  )}
                </TableCell>
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

      {/* ── Diálogo de asignación de asociación ── */}
      <AlertDialog
        open={assocTarget !== null}
        onOpenChange={(open) => { if (!open) setAssocTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <HugeiconsIcon icon={UserGroupIcon} className="mr-2 inline-block size-5 align-text-bottom" />
              Asociación de {assocTarget?.name}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Elige la asociación que avala a este artista, o selecciona
              &quot;Sin asociación&quot; para quitarla.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Select
              value={selectedAssocId}
              onValueChange={(v) => setSelectedAssocId(v ?? "none")}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {activeAssociations.find((a) => a.id === selectedAssocId)?.name
                    ?? "Sin asociación"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin asociación</SelectItem>
                {activeAssociations.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}{a.shortName ? ` (${a.shortName})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAssocSave} disabled={isPending}>
              Guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

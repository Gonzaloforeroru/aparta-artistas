"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import { Separator } from "@/components/ui/separator";
import {
  approveTag,
  rejectTag,
  createTag,
  renameTag,
  updateTagPresentation,
  archiveTag,
  unarchiveTag,
} from "@/app/admin/actions";
import type { PendingTag, CatalogTag, TagKind } from "@/lib/queries/tags";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle01Icon,
  CancelCircleIcon,
  Search01Icon,
  Add01Icon,
  PencilEdit01Icon,
  Cancel01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Tick01Icon,
  Delete02Icon,
  ArchiveRestoreIcon,
} from "@hugeicons/core-free-icons";

// ─── Helpers ────────────────────────────────────────────────────────────────

const KIND_LABELS: Record<TagKind, string> = {
  artist_type: "Tipo de artista",
  genre: "Género musical",
  profession: "Profesión",
  gender: "Género",
};

function KindBadge({ kind }: { kind: TagKind }) {
  return (
    <Badge variant="secondary" className="text-xs font-normal whitespace-nowrap">
      {KIND_LABELS[kind]}
    </Badge>
  );
}

function ColorDot({ color }: { color: string | null }) {
  if (!color) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div
      className="h-4 w-4 rounded-full border border-border"
      style={{ backgroundColor: color }}
      title={color}
    />
  );
}

// ─── Bloque 1 — Cola de aprobación de tags ──────────────────────────────────

function PendingTagsQueue({ tags }: { tags: PendingTag[] }) {
  const [isPending, startTransition] = useTransition();

  function handleApprove(tagId: string) {
    startTransition(async () => {
      const result = await approveTag(tagId);
      if (result.success) {
        toast.success("Tag aprobado y publicado en el catálogo");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleReject(tagId: string) {
    startTransition(async () => {
      const result = await rejectTag(tagId);
      if (result.success) {
        toast.success("Tag rechazado (archivado)");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-lg font-semibold tracking-tight">Cola de aprobación</h2>
        <p className="text-sm text-muted-foreground">
          Tags propuestos por artistas pendientes de revisión
        </p>
      </div>
      {tags.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-8 w-8 text-[var(--success)]" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">Sin tags pendientes</p>
          <p className="text-xs text-muted-foreground/70">Todos los tags propuestos han sido revisados</p>
        </div>
      ) : (
        <div className="rounded-xl bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Propuesto por</TableHead>
                <TableHead className="text-center">Usos</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell className="font-medium">{tag.name}</TableCell>
                  <TableCell><KindBadge kind={tag.kind} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {tag.proposedBy ?? "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center rounded-md bg-[var(--warning-bg)] px-2 py-0.5 text-sm font-semibold tabular-nums text-[var(--warning)]">
                      {tag.usageCount}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        className="gap-1.5 bg-[var(--success)] hover:bg-[var(--success-bg)] hover:text-[var(--success)] text-white"
                        onClick={() => handleApprove(tag.id)}
                        disabled={isPending}
                      >
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-3.5 w-3.5" />
                        Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-destructive border-destructive/30 hover:bg-[var(--error-bg)]"
                        onClick={() => handleReject(tag.id)}
                        disabled={isPending}
                      >
                        <HugeiconsIcon icon={CancelCircleIcon} className="h-3.5 w-3.5" />
                        Rechazar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}

// ─── Bloque 2 — Catálogo de tags ────────────────────────────────────────────

const ALL_KINDS: TagKind[] = ["artist_type", "genre", "profession", "gender"];
const PER_PAGE = 20;

function CatalogSection({ tags }: { tags: CatalogTag[] }) {
  // ── Filtros ──
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(1);

  // ── Crear tag ──
  const [showCreate, setShowCreate] = useState(false);
  const [newKind, setNewKind] = useState<TagKind>("genre");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newSortOrder, setNewSortOrder] = useState(0);

  // ── Editar tag ──
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editSortOrder, setEditSortOrder] = useState(0);

  // ── Archivar/desarchivar confirmación ──
  const [archiveTarget, setArchiveTarget] = useState<CatalogTag | null>(null);

  const [isPending, startTransition] = useTransition();

  // ── Filtrado cliente ──
  const filtered = tags.filter((tag) => {
    if (!showArchived && tag.archivedAt) return false;
    if (kindFilter !== "all" && tag.kind !== kindFilter) return false;
    if (search && !tag.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  const rangeStart = filtered.length > 0 ? (currentPage - 1) * PER_PAGE + 1 : 0;
  const rangeEnd = Math.min(currentPage * PER_PAGE, filtered.length);

  // ── Handlers ──

  function handleCreate() {
    startTransition(async () => {
      const result = await createTag({
        kind: newKind,
        name: newName,
        color: newColor || null,
        sortOrder: newSortOrder,
      });
      if (result.success) {
        toast.success("Tag creado");
        setNewName("");
        setNewColor("");
        setNewSortOrder(0);
        setShowCreate(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  function startEdit(tag: CatalogTag) {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color ?? "");
    setEditSortOrder(tag.sortOrder);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function handleSaveEdit(tag: CatalogTag) {
    startTransition(async () => {
      let hasError = false;

      // Rename if changed
      if (editName !== tag.name) {
        const result = await renameTag(tag.id, editName);
        if (!result.success) {
          toast.error(result.error);
          hasError = true;
        }
      }

      // Update color/sortOrder if changed
      const colorChanged = (editColor || null) !== (tag.color ?? null);
      const sortChanged = editSortOrder !== tag.sortOrder;
      if (colorChanged || sortChanged) {
        const result = await updateTagPresentation(tag.id, {
          color: editColor || null,
          sortOrder: editSortOrder,
        });
        if (!result.success) {
          toast.error(result.error);
          hasError = true;
        }
      }

      if (!hasError) {
        toast.success("Tag actualizado");
        setEditingId(null);
      }
    });
  }

  function handleArchiveToggle(tag: CatalogTag) {
    setArchiveTarget(tag);
  }

  function confirmArchiveToggle() {
    if (!archiveTarget) return;
    const tag = archiveTarget;
    startTransition(async () => {
      const result = tag.archivedAt
        ? await unarchiveTag(tag.id)
        : await archiveTag(tag.id);
      if (result.success) {
        toast.success(tag.archivedAt ? "Tag restaurado" : "Tag archivado");
      } else {
        toast.error(result.error);
      }
      setArchiveTarget(null);
    });
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Catálogo</h2>
          <p className="text-sm text-muted-foreground">
            {tags.length} tags en total · {filtered.length} visible{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setShowCreate(!showCreate)}
        >
          <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />
          Nuevo tag
        </Button>
      </div>

      {/* ── Formulario de creación ── */}
      {showCreate && (
        <div className="mb-4 rounded-xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Crear tag</h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Categoría</Label>
              <Select value={newKind} onValueChange={(v) => setNewKind(v as TagKind)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_KINDS.map((k) => (
                    <SelectItem key={k} value={k}>{KIND_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Nombre</Label>
              <Input
                placeholder="Nombre del tag"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Color (hex)</Label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="#6366f1"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-[120px] font-mono text-xs"
                />
                {newColor && (
                  <div
                    className="h-8 w-8 shrink-0 rounded-md border border-border"
                    style={{ backgroundColor: newColor }}
                  />
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Orden</Label>
              <Input
                type="number"
                value={newSortOrder}
                onChange={(e) => setNewSortOrder(parseInt(e.target.value) || 0)}
                className="w-[80px] tabular-nums"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={isPending || !newName.trim()}>
                Crear
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCreate(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Filtros ── */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10"
          />
        </div>
        <div className="flex gap-3">
          <Select
            value={kindFilter}
            onValueChange={(v) => { setKindFilter(v ?? "all"); setPage(1); }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {ALL_KINDS.map((k) => (
                <SelectItem key={k} value={k}>{KIND_LABELS[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={showArchived ? "default" : "outline"}
            size="sm"
            onClick={() => { setShowArchived(!showArchived); setPage(1); }}
            className="whitespace-nowrap"
          >
            {showArchived ? "Ocultar archivados" : "Mostrar archivados"}
          </Button>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="rounded-xl bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="w-[60px]">Color</TableHead>
              <TableHead className="w-[70px] text-center">Orden</TableHead>
              <TableHead className="w-[60px] text-center">Usos</TableHead>
              <TableHead className="w-[80px]">Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No se encontraron tags
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((tag) =>
                editingId === tag.id ? (
                  <TableRow key={tag.id} className="bg-accent/30">
                    <TableCell>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell><KindBadge kind={tag.kind} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Input
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          placeholder="#hex"
                          className="h-8 w-[80px] font-mono text-xs"
                        />
                        {editColor && (
                          <div
                            className="h-6 w-6 shrink-0 rounded border border-border"
                            style={{ backgroundColor: editColor }}
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        value={editSortOrder}
                        onChange={(e) => setEditSortOrder(parseInt(e.target.value) || 0)}
                        className="h-8 w-[60px] text-center tabular-nums text-sm"
                      />
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-sm text-muted-foreground">
                      {tag.usageCount}
                    </TableCell>
                    <TableCell>
                      {tag.archivedAt ? (
                        <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">Archivado</Badge>
                      ) : tag.isOfficial ? (
                        <Badge variant="secondary" className="text-xs bg-[var(--success-bg)] text-[var(--success)]">Oficial</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs bg-[var(--warning-bg)] text-[var(--warning)]">Pendiente</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[var(--success)]"
                          onClick={() => handleSaveEdit(tag)}
                          disabled={isPending}
                          title="Guardar"
                        >
                          <HugeiconsIcon icon={Tick01Icon} className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={cancelEdit}
                          disabled={isPending}
                          title="Cancelar"
                        >
                          <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={tag.id} className={tag.archivedAt ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{tag.name}</TableCell>
                    <TableCell><KindBadge kind={tag.kind} /></TableCell>
                    <TableCell><ColorDot color={tag.color} /></TableCell>
                    <TableCell className="text-center tabular-nums text-sm text-muted-foreground">
                      {tag.sortOrder}
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-sm text-muted-foreground">
                      {tag.usageCount}
                    </TableCell>
                    <TableCell>
                      {tag.archivedAt ? (
                        <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">Archivado</Badge>
                      ) : tag.isOfficial ? (
                        <Badge variant="secondary" className="text-xs bg-[var(--success-bg)] text-[var(--success)]">Oficial</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs bg-[var(--warning-bg)] text-[var(--warning)]">Pendiente</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => startEdit(tag)}
                          disabled={isPending}
                          title="Editar"
                        >
                          <HugeiconsIcon icon={PencilEdit01Icon} className="h-4 w-4" />
                        </Button>
                        {tag.archivedAt ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[var(--success)]"
                            onClick={() => handleArchiveToggle(tag)}
                            disabled={isPending}
                            title="Restaurar"
                          >
                            <HugeiconsIcon icon={ArchiveRestoreIcon} className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleArchiveToggle(tag)}
                            disabled={isPending}
                            title="Archivar"
                          >
                            <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ),
              )
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Paginación ── */}
      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>Mostrando {rangeStart}–{rangeEnd} de {filtered.length} tags</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <HugeiconsIcon icon={ArrowUp01Icon} className="mr-1 h-3.5 w-3.5 -rotate-90" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Siguiente
            <HugeiconsIcon icon={ArrowDown01Icon} className="ml-1 h-3.5 w-3.5 -rotate-90" />
          </Button>
        </div>
      </div>

      {/* ── Diálogo de confirmación archivar/restaurar ── */}
      <AlertDialog
        open={archiveTarget !== null}
        onOpenChange={(open) => { if (!open) setArchiveTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {archiveTarget?.archivedAt ? "¿Restaurar tag?" : "¿Archivar tag?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {archiveTarget?.archivedAt
                ? `"${archiveTarget.name}" volverá a ser visible en el catálogo y los formularios de artistas.`
                : `"${archiveTarget?.name}" dejará de aparecer en el catálogo y los formularios. Los artistas que lo usan lo conservan, y puedes restaurarlo después.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant={archiveTarget?.archivedAt ? "default" : "destructive"}
              onClick={confirmArchiveToggle}
              disabled={isPending}
            >
              {archiveTarget?.archivedAt ? "Restaurar" : "Archivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

// ─── Componente principal ───────────────────────────────────────────────────

interface TagsContentProps {
  pendingTags: PendingTag[];
  catalogTags: CatalogTag[];
}

export function TagsContent({ pendingTags, catalogTags }: TagsContentProps) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Etiquetas</h1>
        <p className="text-sm text-muted-foreground">
          Gestión de tags y géneros
        </p>
      </div>

      <PendingTagsQueue tags={pendingTags} />

      <Separator />

      <CatalogSection tags={catalogTags} />
    </div>
  );
}

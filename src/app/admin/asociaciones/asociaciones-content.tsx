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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  createAssociation,
  renameAssociation,
  updateAssociationPresentation,
  toggleAssociationActive,
} from "@/app/admin/actions";
import type { Association } from "@/lib/queries/associations";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  PencilEdit01Icon,
  Cancel01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";

/**
 * Paleta fija para las insignias.
 *
 * No son colores elegidos al azar: la insignia se pinta sobre el fondo OSCURO
 * de la tarjeta, usando el color para el texto y el borde. Un azul marino o un
 * granate quedarian ilegibles ahi. Todos estos tienen luminosidad suficiente
 * para leerse sobre oscuro.
 */
const COLORES = [
  { hex: "#2f7bf6", nombre: "Azul" },
  { hex: "#22b8cf", nombre: "Turquesa" },
  { hex: "#12b886", nombre: "Verde" },
  { hex: "#82c91e", nombre: "Lima" },
  { hex: "#fab005", nombre: "Ámbar" },
  { hex: "#f59f00", nombre: "Naranja" },
  { hex: "#fa5252", nombre: "Rojo" },
  { hex: "#e64980", nombre: "Rosa" },
  { hex: "#7950f2", nombre: "Morado" },
  { hex: "#adb5bd", nombre: "Gris" },
];

/**
 * Selector de color por paleta.
 *
 * Antes era un campo de texto donde habia que teclear "#6366f1" de memoria.
 * Nadie sabe codigos hexadecimales, asi que en la practica el color se quedaba
 * vacio. Se elige pulsando, y queda el cuentagotas del navegador para cuando la
 * institucion tenga un color de marca concreto.
 */
function ColorPicker({
  value,
  onChange,
  compact = false,
}: {
  value: string;
  onChange: (hex: string) => void;
  compact?: boolean;
}) {
  const size = compact ? "size-5" : "size-7";
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {COLORES.map((c) => (
        <button
          key={c.hex}
          type="button"
          title={c.nombre}
          aria-label={c.nombre}
          aria-pressed={value.toLowerCase() === c.hex}
          onClick={() => onChange(value.toLowerCase() === c.hex ? "" : c.hex)}
          className={`${size} rounded-full transition-transform hover:scale-110 ${
            value.toLowerCase() === c.hex
              ? "ring-2 ring-white ring-offset-2 ring-offset-[var(--background)]"
              : "ring-1 ring-white/20"
          }`}
          style={{ backgroundColor: c.hex }}
        />
      ))}
      {/* Escape para colores de marca que no esten en la paleta. */}
      <label
        title="Otro color"
        className={`${size} relative cursor-pointer overflow-hidden rounded-full ring-1 ring-white/20`}
        style={{
          background:
            "conic-gradient(#fa5252,#fab005,#82c91e,#12b886,#22b8cf,#2f7bf6,#7950f2,#e64980,#fa5252)",
        }}
      >
        <input
          type="color"
          value={value || "#2f7bf6"}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Quitar
        </button>
      )}
    </div>
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

export function AsociacionesContent({ associations }: { associations: Association[] }) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newShortName, setNewShortName] = useState("");
  const [newColor, setNewColor] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editShortName, setEditShortName] = useState("");
  const [editColor, setEditColor] = useState("");

  const [toggleTarget, setToggleTarget] = useState<Association | null>(null);

  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    startTransition(async () => {
      const result = await createAssociation({
        name: newName,
        shortName: newShortName || null,
        color: newColor || null,
      });
      if (result.success) {
        toast.success("Asociación creada");
        setNewName("");
        setNewShortName("");
        setNewColor("");
        setShowCreate(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  function startEdit(assoc: Association) {
    setEditingId(assoc.id);
    setEditName(assoc.name);
    setEditShortName(assoc.shortName ?? "");
    setEditColor(assoc.color ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function handleSaveEdit(assoc: Association) {
    startTransition(async () => {
      let hasError = false;

      if (editName !== assoc.name) {
        const result = await renameAssociation(assoc.id, editName);
        if (!result.success) {
          toast.error(result.error);
          hasError = true;
        }
      }

      const shortNameChanged = (editShortName || null) !== (assoc.shortName ?? null);
      const colorChanged = (editColor || null) !== (assoc.color ?? null);
      if (shortNameChanged || colorChanged) {
        const result = await updateAssociationPresentation(assoc.id, {
          shortName: editShortName || null,
          color: editColor || null,
        });
        if (!result.success) {
          toast.error(result.error);
          hasError = true;
        }
      }

      if (!hasError) {
        toast.success("Asociación actualizada");
        setEditingId(null);
      }
    });
  }

  function confirmToggle() {
    if (!toggleTarget) return;
    const assoc = toggleTarget;
    startTransition(async () => {
      const result = await toggleAssociationActive(assoc.id, !assoc.active);
      if (result.success) {
        toast.success(assoc.active ? "Asociación desactivada" : "Asociación activada");
      } else {
        toast.error(result.error);
      }
      setToggleTarget(null);
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Asociaciones</h1>
          <p className="text-sm text-muted-foreground">
            {associations.length} asociacion{associations.length !== 1 ? "es" : ""} registrada{associations.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setShowCreate(!showCreate)}
        >
          <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />
          Nueva asociación
        </Button>
      </div>

      {/* ── Formulario de creación ── */}
      {showCreate && (
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Crear asociación</h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Nombre</Label>
              <Input
                placeholder="Nombre de la asociación"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Sigla (opcional)</Label>
              <Input
                placeholder="Ej: CUC"
                value={newShortName}
                onChange={(e) => setNewShortName(e.target.value)}
                maxLength={12}
                className="w-[100px] font-mono text-xs"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Color de la insignia</Label>
              <div className="flex items-center gap-2">
                <ColorPicker value={newColor} onChange={setNewColor} />
              </div>
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

          {/*
            La ayuda va bajo la fila entera y no colgando del campo Sigla.
            Dentro de la columna anadia alto solo a esa, y como la fila alinea
            por abajo (items-end) le levantaba el input y rompia la simetria de
            todos los demas.
          */}
          <p className="mt-2.5 text-[11px] leading-tight text-muted-foreground">
            La <strong className="font-semibold">sigla</strong> se usa en la
            tarjeta del catálogo cuando el nombre es largo, y el{" "}
            <strong className="font-semibold">color</strong> es el de la insignia
            que verá el público.
          </p>
        </div>
      )}

      {/* ── Tabla ── */}
      <div className="rounded-xl bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="w-[90px]">Sigla</TableHead>
              <TableHead className="w-[60px]">Color</TableHead>
              <TableHead className="w-[80px] text-center">Artistas</TableHead>
              <TableHead className="w-[80px]">Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {associations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No hay asociaciones registradas
                </TableCell>
              </TableRow>
            ) : (
              associations.map((assoc) =>
                editingId === assoc.id ? (
                  <TableRow key={assoc.id} className="bg-accent/30">
                    <TableCell>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={editShortName}
                        onChange={(e) => setEditShortName(e.target.value)}
                        placeholder="Sigla"
                        maxLength={12}
                        className="h-8 w-[80px] font-mono text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <ColorPicker value={editColor} onChange={setEditColor} compact />
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-sm text-muted-foreground">
                      {assoc.artistCount}
                    </TableCell>
                    <TableCell>
                      {assoc.active ? (
                        <Badge variant="secondary" className="text-xs bg-[var(--success-bg)] text-[var(--success)]">Activa</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">Inactiva</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[var(--success)]"
                          onClick={() => handleSaveEdit(assoc)}
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
                  <TableRow key={assoc.id} className={!assoc.active ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{assoc.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {assoc.shortName ?? <span className="text-muted-foreground/50">—</span>}
                    </TableCell>
                    <TableCell><ColorDot color={assoc.color} /></TableCell>
                    <TableCell className="text-center tabular-nums text-sm text-muted-foreground">
                      {assoc.artistCount}
                    </TableCell>
                    <TableCell>
                      {assoc.active ? (
                        <Badge variant="secondary" className="text-xs bg-[var(--success-bg)] text-[var(--success)]">Activa</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">Inactiva</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => startEdit(assoc)}
                          disabled={isPending}
                          title="Editar"
                        >
                          <HugeiconsIcon icon={PencilEdit01Icon} className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={assoc.active
                            ? "text-muted-foreground hover:text-destructive"
                            : "text-[var(--success)]"
                          }
                          onClick={() => setToggleTarget(assoc)}
                          disabled={isPending}
                        >
                          {assoc.active ? "Desactivar" : "Activar"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ),
              )
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Diálogo de confirmación activar/desactivar ── */}
      <AlertDialog
        open={toggleTarget !== null}
        onOpenChange={(open) => { if (!open) setToggleTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.active ? "¿Desactivar asociación?" : "¿Activar asociación?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.active
                ? `"${toggleTarget.name}" dejará de ser visible públicamente. Los artistas que la tienen la conservan.`
                : `"${toggleTarget?.name}" volverá a ser visible públicamente.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant={toggleTarget?.active ? "destructive" : "default"}
              onClick={confirmToggle}
              disabled={isPending}
            >
              {toggleTarget?.active ? "Desactivar" : "Activar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

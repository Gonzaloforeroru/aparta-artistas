"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import {
  Link01Icon, Copy01Icon, CheckmarkCircle01Icon,
  Clock01Icon, CancelCircleIcon, Add01Icon,
} from "@hugeicons/core-free-icons";
import { createInvitation } from "@/app/admin/actions";
import type { Association } from "@/lib/queries/associations";

type InvitationRow = {
  token: string;
  kind: string;
  label: string | null;
  email: string | null;
  association_id: string | null;
  max_uses: number | null;
  uses_count: number;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  created_by: string;
  associations: { id: string; name: string } | null;
};

function getStatus(inv: InvitationRow): "pendiente" | "agotado" | "expirado" {
  if (inv.max_uses !== null && inv.uses_count >= inv.max_uses) return "agotado";
  if (new Date(inv.expires_at) < new Date()) return "expirado";
  return "pendiente";
}

function StatusBadge({ status }: { status: "pendiente" | "agotado" | "expirado" }) {
  const config = {
    pendiente: { label: "Activa", icon: Clock01Icon, className: "bg-[var(--warning-bg)] text-[var(--warning)]" },
    agotado: { label: "Agotada", icon: CheckmarkCircle01Icon, className: "bg-[var(--success-bg)] text-[var(--success)]" },
    expirado: { label: "Expirada", icon: CancelCircleIcon, className: "bg-muted text-muted-foreground" },
  };
  const c = config[status];
  return (
    <Badge variant="secondary" className={c.className}>
      <HugeiconsIcon icon={c.icon as IconSvgElement} className="mr-1 size-3" /> {c.label}
    </Badge>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface InvitacionesContentProps {
  invitations: InvitationRow[];
  associations: Association[];
}

export function InvitacionesContent({ invitations, associations }: InvitacionesContentProps) {
  const [kind, setKind] = useState<"personal" | "campaign">("personal");
  const [label, setLabel] = useState("");
  const [associationId, setAssociationId] = useState<string>("none");
  const [days, setDays] = useState(1);
  const [maxUses, setMaxUses] = useState<number | "">(10);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeAssociations = associations.filter((a) => a.active);

  function handleGenerate() {
    startTransition(async () => {
      try {
        const result = await createInvitation({
          kind,
          label: label || undefined,
          associationId: associationId !== "none" ? associationId : null,
          days,
          maxUses: kind === "campaign" ? (maxUses || null) : undefined,
        });
        setGeneratedLink(result.link);
        toast.success("Link de invitación generado");
      } catch {
        toast.error("Error al generar invitación");
      }
    });
  }

  function handleCopy() {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      toast.success("Link copiado al portapapeles");
    }
  }

  function handleReset() {
    setLabel("");
    setAssociationId("none");
    setDays(1);
    setMaxUses(10);
    setGeneratedLink(null);
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Invitaciones</h1>
        <p className="text-sm text-muted-foreground">Genera enlaces de registro para artistas</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={Link01Icon} className="size-5 text-primary" />
            Generar Link de Registro
          </CardTitle>
          <CardDescription>Configura el tipo, duración y asociación del enlace</CardDescription>
        </CardHeader>
        <CardContent>
          {!generatedLink ? (
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Tipo</Label>
                  <Select value={kind} onValueChange={(v) => setKind(v as "personal" | "campaign")}>
                    <SelectTrigger className="w-full">
                      {/*
                        Se pinta el texto a mano en vez de dejar <SelectValue />
                        vacio: el Select de Base UI muestra el VALOR crudo
                        ("personal", "none") en lugar de la etiqueta del item.
                      */}
                      <SelectValue>
                        {kind === "personal"
                          ? "Personal (un solo uso)"
                          : "Campaña (múltiples usos)"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal (un solo uso)</SelectItem>
                      <SelectItem value="campaign">Campaña (múltiples usos)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Etiqueta (opcional)</Label>
                  <Input
                    placeholder="Ej: Convocatoria Enero 2027"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5 sm:col-span-3">
                  <Label className="text-xs text-muted-foreground">
                    Insignia de asociación
                  </Label>

                  {activeAssociations.length === 0 ? (
                    /*
                      Sin asociaciones creadas el desplegable solo ofrecia "Sin
                      asociacion", y no habia forma de saber que primero hay que
                      crearlas en otra pantalla. Se dice explicitamente.
                    */
                    <div className="rounded-lg border border-dashed border-white/15 px-3 py-2.5 text-xs text-muted-foreground">
                      Todavía no hay ninguna asociación creada.{" "}
                      <Link
                        href="/admin/asociaciones"
                        className="font-semibold text-[var(--cta)] underline underline-offset-2"
                      >
                        Crea la primera
                      </Link>{" "}
                      y podrás asignarla a este enlace.
                    </div>
                  ) : (
                    <>
                      <Select
                        value={associationId}
                        onValueChange={(v) => setAssociationId(v ?? "none")}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {activeAssociations.find((a) => a.id === associationId)?.name ??
                              "Sin insignia"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin insignia</SelectItem>
                          {activeAssociations.map((a) => (
                            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-[var(--text-muted)]">
                        Quien se registre por este enlace queda avalado por la
                        asociación elegida y le sale su insignia. Sin insignia, se
                        registra como cualquier otro artista.
                      </p>
                    </>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Días de validez</Label>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={days}
                    onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                    className="tabular-nums"
                  />
                </div>
                {kind === "campaign" && (
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Cupo máximo (vacío = ilimitado)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={maxUses}
                      onChange={(e) => setMaxUses(e.target.value ? parseInt(e.target.value) : "")}
                      placeholder="∞"
                      className="tabular-nums"
                    />
                  </div>
                )}
              </div>

              <Button onClick={handleGenerate} disabled={isPending} className="h-11 gap-2 w-fit">
                <HugeiconsIcon icon={Add01Icon} className="size-4" />
                Generar Link
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label className="text-muted-foreground">Link generado{label ? ` — ${label}` : ""}</Label>
                <div className="flex items-center gap-2">
                  <Input value={generatedLink} readOnly className="h-11 font-mono text-sm" />
                  <Button variant="outline" size="icon" className="h-11 w-11 shrink-0" onClick={handleCopy}>
                    <HugeiconsIcon icon={Copy01Icon} className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-[var(--warning-bg)] text-[var(--warning)]">
                  <HugeiconsIcon icon={Clock01Icon} className="mr-1 size-3" /> Expira en {days} día{days !== 1 ? "s" : ""}
                </Badge>
                <Button variant="ghost" size="sm" onClick={handleReset}>Generar otra</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Invitaciones</CardTitle>
          <CardDescription>{invitations.length} invitaciones en total</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Etiqueta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Asociación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">Usos</TableHead>
                  <TableHead>Caduca</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.token}>
                    <TableCell className="font-medium">
                      {inv.label || inv.email || <span className="text-muted-foreground italic">Sin etiqueta</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {inv.kind === "campaign" ? "Campaña" : "Personal"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {inv.associations?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={getStatus(inv)} />
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-sm">
                      {inv.uses_count}{inv.max_uses !== null ? ` / ${inv.max_uses}` : " / ∞"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                      {formatDate(inv.expires_at)}
                    </TableCell>
                  </TableRow>
                ))}
                {invitations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No hay invitaciones aún
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

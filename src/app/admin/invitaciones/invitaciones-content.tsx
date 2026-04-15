"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import {
  Link01Icon, Copy01Icon, CheckmarkCircle01Icon,
  Clock01Icon, CancelCircleIcon, Add01Icon,
} from "@hugeicons/core-free-icons";
import { createInvitation } from "@/app/admin/actions";
import type { Tables } from "@/lib/supabase/database.types";

type Invitation = Tables<"invitations">;

function getStatus(inv: Invitation): "pendiente" | "usado" | "expirado" {
  if (inv.used_at) return "usado";
  if (new Date(inv.expires_at) < new Date()) return "expirado";
  return "pendiente";
}

function StatusBadge({ status }: { status: "pendiente" | "usado" | "expirado" }) {
  const config = {
    pendiente: { label: "Pendiente", icon: Clock01Icon, className: "bg-[var(--warning-bg)] text-[var(--warning)]" },
    usado: { label: "Usado", icon: CheckmarkCircle01Icon, className: "bg-[var(--success-bg)] text-[var(--success)]" },
    expirado: { label: "Expirado", icon: CancelCircleIcon, className: "bg-muted text-muted-foreground" },
  };
  const c = config[status];
  return (<Badge variant="secondary" className={c.className}><HugeiconsIcon icon={c.icon as IconSvgElement} className="mr-1 size-3" /> {c.label}</Badge>);
}

export function InvitacionesContent({ invitations }: { invitations: Invitation[] }) {
  const [nota, setNota] = useState("");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    startTransition(async () => {
      try {
        const result = await createInvitation(nota || undefined);
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

  function handleReset() { setNota(""); setGeneratedLink(null); }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Invitaciones</h1>
        <p className="text-sm text-muted-foreground">Genera links de registro de un solo uso para artistas</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><HugeiconsIcon icon={Link01Icon} className="size-5 text-primary" />Generar Link de Registro</CardTitle>
          <CardDescription>El link expira en 24 horas y solo se puede usar una vez</CardDescription>
        </CardHeader>
        <CardContent>
          {!generatedLink ? (
            <div className="flex flex-col gap-4">
              <div>
                <Label htmlFor="invite-nota" className="text-muted-foreground">Nota (opcional — para tu referencia)</Label>
                <Input id="invite-nota" placeholder="Ej: Juan Pérez, cantante de vallenato" className="mt-1.5 h-11"
                  value={nota} onChange={(e) => setNota(e.target.value)} />
              </div>
              <Button onClick={handleGenerate} disabled={isPending} className="h-11 gap-2 w-fit">
                <HugeiconsIcon icon={Add01Icon} className="size-4" />Generar Link
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label className="text-muted-foreground">Link generado{nota ? ` — ${nota}` : ""}</Label>
                <div className="flex items-center gap-2">
                  <Input value={generatedLink} readOnly className="h-11 font-mono text-sm" />
                  <Button variant="outline" size="icon" className="h-11 w-11 shrink-0" onClick={handleCopy}><HugeiconsIcon icon={Copy01Icon} className="size-4" /></Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-[var(--warning-bg)] text-[var(--warning)]"><HugeiconsIcon icon={Clock01Icon} className="mr-1 size-3" /> Expira en 24 horas</Badge>
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
                  <TableHead>Nota</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creada</TableHead>
                  <TableHead>Usada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.token}>
                    <TableCell className="font-medium">{inv.email || <span className="text-muted-foreground italic">Sin nota</span>}</TableCell>
                    <TableCell><StatusBadge status={getStatus(inv)} /></TableCell>
                    <TableCell className="text-muted-foreground">{new Date(inv.created_at).toLocaleDateString("es-CO")}</TableCell>
                    <TableCell className="text-muted-foreground">{inv.used_at ? new Date(inv.used_at).toLocaleDateString("es-CO") : "—"}</TableCell>
                  </TableRow>
                ))}
                {invitations.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No hay invitaciones aún</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

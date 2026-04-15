"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { importArtists } from "@/app/admin/actions";
import { artistTypes as VALID_TYPES, genres as VALID_GENRES } from "@/lib/data";
import type { ArtistType, Genre } from "@/lib/supabase/database.types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Upload01Icon, FileSpreadsheetIcon, CheckmarkCircle01Icon,
  CancelCircleIcon, Download01Icon,
} from "@hugeicons/core-free-icons";

interface CsvRow {
  nombre: string;
  ciudad: string;
  tipo: string;
  genero: string;
  telefono: string;
  precio: string;
  duracion: string;
  valid: boolean;
  error?: string;
}

function validateRow(row: Omit<CsvRow, "valid" | "error">): { valid: boolean; error?: string } {
  if (!row.nombre?.trim()) return { valid: false, error: "Nombre requerido" };
  if (!row.ciudad?.trim()) return { valid: false, error: "Ciudad requerida" };
  if (!row.tipo?.trim()) return { valid: false, error: "Tipo requerido" };
  if (!VALID_TYPES.includes(row.tipo as ArtistType)) return { valid: false, error: `Tipo inválido: ${row.tipo}` };
  if (!row.genero?.trim()) return { valid: false, error: "Género requerido" };
  if (!VALID_GENRES.includes(row.genero as Genre)) return { valid: false, error: `Género inválido: ${row.genero}` };
  if (!row.telefono?.trim()) return { valid: false, error: "Teléfono requerido" };
  if (!row.precio?.trim() || isNaN(Number(row.precio))) return { valid: false, error: "Precio inválido" };
  if (!row.duracion?.trim()) return { valid: false, error: "Duración requerida" };
  return { valid: true };
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const raw: Record<string, string> = {};
    headers.forEach((h, i) => { raw[h] = values[i] ?? ""; });
    const row = {
      nombre: raw["nombre"] ?? "", ciudad: raw["ciudad"] ?? "", tipo: raw["tipo"] ?? "",
      genero: raw["genero"] ?? "", telefono: raw["telefono"] ?? "",
      precio: raw["precio"] ?? "", duracion: raw["duracion"] ?? "",
    };
    const validation = validateRow(row);
    return { ...row, ...validation };
  });
}

function downloadTemplate() {
  const headers = ["nombre", "ciudad", "tipo", "genero", "telefono", "precio", "duracion", "instagram", "tiktok", "youtube", "spotify"];
  const exampleRow = [
    "Juan Pérez",
    "Bogotá",
    "Cantante",
    "Vallenato",
    "3101234567",
    "500000",
    "2 horas",
    "https://instagram.com/juanperez",
    "https://tiktok.com/@juanperez",
    "https://youtube.com/@juanperez",
    "https://open.spotify.com/artist/juanperez"
  ];
  const csvContent = [headers.join(","), exampleRow.join(",")].join("\n");
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "plantilla_artistas.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function AdminImportarPage() {
  const [preview, setPreview] = useState<CsvRow[] | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleFile(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setPreview(parseCsv(text));
    };
    reader.readAsText(file);
  }

  function handleImport() {
    const validRows = preview?.filter((r) => r.valid) ?? [];
    if (validRows.length === 0) return;
    startTransition(async () => {
      try {
        const rows = validRows.map((r) => ({
          name: r.nombre, city: r.ciudad, type: r.tipo as ArtistType,
          genre: r.genero as Genre, phone: r.telefono,
          price: parseInt(r.precio), duration: r.duracion,
        }));
        const result = await importArtists(rows);
        toast.success(`${result.count} artistas importados exitosamente`);
        setPreview(null);
      } catch { toast.error("Error al importar artistas"); }
    });
  }

  const validCount = preview?.filter((r) => r.valid).length ?? 0;
  const invalidCount = preview?.filter((r) => !r.valid).length ?? 0;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Importar Artistas</h1>
          <p className="text-sm text-muted-foreground">Carga masiva de artistas desde archivo CSV</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={downloadTemplate}>
          <HugeiconsIcon icon={Download01Icon} className="size-4" />
          Descargar plantilla CSV
        </Button>
      </div>

       {!preview ? (
<Card
            className={`border-2 border-dashed transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
        >
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
              <HugeiconsIcon icon={FileSpreadsheetIcon} className="size-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">Arrastra tu archivo CSV aquí</p>
              <p className="text-sm text-muted-foreground mt-1">o haz clic para seleccionar</p>
            </div>
            <Button nativeButton={false} render={<label />} variant="outline" className="gap-2">
              <HugeiconsIcon icon={Upload01Icon} className="size-4" />
              Seleccionar archivo
              <input type="file" accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
            </Button>
            <p className="text-xs text-muted-foreground">
              Columnas: nombre, ciudad, tipo, genero, telefono, precio, duracion, instagram, tiktok, youtube, spotify
            </p>
          </CardContent>
        </Card>
      ) : (
         <div className="flex flex-col gap-4">
           <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Vista previa</CardTitle>
                  <CardDescription>{preview.length} filas encontradas</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-[var(--success-bg)] text-[var(--success)]">
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} className="mr-1 size-3" /> {validCount} válidas
                  </Badge>
                  {invalidCount > 0 && (
                    <Badge variant="secondary" className="bg-[var(--error-bg)] text-[var(--error)]">
                      <HugeiconsIcon icon={CancelCircleIcon} className="mr-1 size-3" /> {invalidCount} con errores
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
               <div className="rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Ciudad</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Género</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Precio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((row, i) => (
                      <TableRow key={i} className={row.valid ? "" : "bg-[var(--error-bg)]/30"}>
                        <TableCell>
                          {row.valid ? (
                            <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4 text-[var(--success)]" />
                          ) : (
                            <HugeiconsIcon icon={CancelCircleIcon} className="size-4 text-[var(--error)]" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{row.nombre || <span className="text-[var(--error)] italic">vacío</span>}</TableCell>
                        <TableCell>{row.ciudad}</TableCell>
                        <TableCell>{row.tipo}</TableCell>
                        <TableCell>{row.genero}</TableCell>
                        <TableCell>{row.telefono}</TableCell>
                        <TableCell>{row.precio}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setPreview(null)}>Cancelar</Button>
            <Button onClick={handleImport} disabled={isPending || validCount === 0} className="gap-2">
              <HugeiconsIcon icon={Upload01Icon} className="size-4" />
              {isPending ? "Importando..." : `Importar ${validCount} artistas válidos`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

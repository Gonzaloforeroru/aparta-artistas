"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { Department, Municipality } from "@/lib/queries/places";

/** "Bogotá, D.C." -> "bogota, d.c." para poder buscar sin tildes. */
function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

type Props = {
  departments: Department[];
  municipalities: Municipality[];
  /** Codigo DANE guardado en artists.municipality_code. */
  initialCode: string | null;
  /** artists.city: respaldo para registros que aun no tienen codigo. */
  initialCityName: string | null;
};

export function CitySelect({
  departments,
  municipalities,
  initialCode,
  initialCityName,
}: Props) {
  /**
   * El municipio manda: de el se deduce el departamento. Si el artista todavia
   * no tiene codigo se intenta rescatar por nombre, y si tampoco casa se deja
   * vacio en vez de adivinar mal.
   */
  const initialMunicipality = useMemo(() => {
    if (initialCode) {
      const byCode = municipalities.find((m) => m.code === initialCode);
      if (byCode) return byCode;
    }
    if (initialCityName) {
      const needle = fold(initialCityName);
      return (
        municipalities.find((m) => fold(m.name) === needle) ??
        municipalities.find((m) => fold(m.name).startsWith(`${needle} `)) ??
        municipalities.find((m) => fold(m.name).startsWith(`${needle},`)) ??
        null
      );
    }
    return null;
  }, [initialCode, initialCityName, municipalities]);

  const [departmentCode, setDepartmentCode] = useState<string>(
    initialMunicipality?.department_code ?? "",
  );
  const [municipalityCode, setMunicipalityCode] = useState<string>(
    initialMunicipality?.code ?? "",
  );
  /**
   * Acotar por departamento deja como mucho 125 municipios (Antioquia), que se
   * recorren bien en el desplegable. Por eso no hace falta un buscador aparte.
   */
  const options = useMemo(() => {
    if (!departmentCode) return [];
    return municipalities.filter((m) => m.department_code === departmentCode);
  }, [departmentCode, municipalities]);

  const selected = municipalities.find((m) => m.code === municipalityCode);

  return (
    <>
      {/* Lo que realmente viaja en el submit. */}
      <input type="hidden" name="municipality_code" value={municipalityCode} />
      <input type="hidden" name="city" value={selected?.name ?? ""} />

      <div className="flex flex-col gap-2">
        <Label>
          Departamento <span className="text-destructive">*</span>
        </Label>
        <Select
          value={departmentCode}
          onValueChange={(v) => {
            // Cambiar de departamento invalida el municipio elegido.
            setDepartmentCode((v as string) ?? "");
            setMunicipalityCode("");
          }}
        >
          {/*
            Base UI pinta el `value` crudo en el trigger, y aqui el value es el
            codigo DANE. Sin esto el artista veria "76" en vez de
            "Valle del Cauca".
          */}
          <SelectTrigger>
            <span className="flex-1 truncate text-left">
              {departments.find((d) => d.code === departmentCode)?.name ?? (
                <span className="text-muted-foreground">Seleccionar</span>
              )}
            </span>
          </SelectTrigger>
          <SelectContent>
            {departments.map((d) => (
              <SelectItem key={d.code} value={d.code}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label>
          Municipio <span className="text-destructive">*</span>
        </Label>


        <Select
          value={municipalityCode}
          onValueChange={(v) => setMunicipalityCode((v as string) ?? "")}
          disabled={!departmentCode}
        >
          <SelectTrigger>
            <span className="flex-1 truncate text-left">
              {selected?.name ?? (
                <span className="text-muted-foreground">
                  {departmentCode
                    ? "Seleccionar"
                    : "Elige un departamento primero"}
                </span>
              )}
            </span>
          </SelectTrigger>
          <SelectContent>
            {options.map((m) => (
              <SelectItem key={m.code} value={m.code}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

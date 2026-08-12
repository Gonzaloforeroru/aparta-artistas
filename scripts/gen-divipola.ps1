# Genera la migracion de Divipola (departamentos y municipios de Colombia)
# a partir del CSV oficial del DANE publicado en datos.gov.co.
#
# Fuente: https://www.datos.gov.co/Mapas-Nacionales/DIVIPOLA-C-digos-municipios/gdxc-w37w
# Licencia: CC BY-SA 4.0
#
# Uso:  pwsh scripts/gen-divipola.ps1
# Salida: supabase/migrations/20260811130000_divipola.sql

$ErrorActionPreference = "Stop"

$csvUrl  = "https://www.datos.gov.co/api/views/gdxc-w37w/rows.csv?accessType=DOWNLOAD"
$tmp     = Join-Path $env:TEMP "divipola.csv"
$outFile = Join-Path $PSScriptRoot "..\supabase\migrations\20260811130000_divipola.sql"

Write-Host "Descargando CSV del DANE..."
Invoke-WebRequest -Uri $csvUrl -OutFile $tmp -UseBasicParsing
$rows = Import-Csv -Path $tmp -Encoding UTF8
Write-Host "Filas descargadas: $($rows.Count)"

# Detecta los nombres reales de columna (el CSV trae tildes en los encabezados)
$cols       = $rows[0].PSObject.Properties.Name
$colDeptCod = $cols | Where-Object { $_ -match 'Departamento' -and $_ -match 'digo' } | Select-Object -First 1
$colDeptNom = $cols | Where-Object { $_ -match 'Departamento' -and $_ -notmatch 'digo' } | Select-Object -First 1
$colMuniCod = $cols | Where-Object { $_ -match 'Municipio'    -and $_ -match 'digo' } | Select-Object -First 1
$colMuniNom = $cols | Where-Object { $_ -match 'Municipio'    -and $_ -notmatch 'digo' -and $_ -notmatch 'Tipo' } | Select-Object -First 1
$colTipo    = $cols | Where-Object { $_ -match 'Tipo' } | Select-Object -First 1

Write-Host "Columnas: '$colDeptCod' '$colDeptNom' '$colMuniCod' '$colMuniNom' '$colTipo'"
if (-not $colDeptCod -or -not $colMuniCod -or -not $colMuniNom) {
  throw "No se pudieron detectar las columnas del CSV. Encabezados: $($cols -join ' | ')"
}

# El DANE entrega los nombres en MAYUSCULAS. Los pasamos a capitalizacion
# normal respetando conectores en minuscula, para que se vean bien en el select.
$conectores = @('de','del','la','las','los','y','e','el','en','a')

function ConvertTo-NombrePropio([string]$texto) {
  if ([string]::IsNullOrWhiteSpace($texto)) { return $texto }
  $t = $texto.Trim() -replace '\s+', ' '
  $palabras = $t.ToLower() -split ' '
  $out = for ($i = 0; $i -lt $palabras.Count; $i++) {
    $w = $palabras[$i]
    if ($w -match '^d\.?c\.?,?$') {
      $w.ToUpper()                              # D.C.
    }
    elseif ($i -gt 0 -and $conectores -contains ($w -replace '[^\p{L}]','')) {
      $w                                        # conector en minuscula
    }
    else {
      # Capitaliza la primera letra, incluso si viene tras un parentesis o comilla
      $idx = 0
      while ($idx -lt $w.Length -and $w[$idx] -notmatch '\p{L}') { $idx++ }
      if ($idx -lt $w.Length) {
        $w.Substring(0, $idx) + [string]::new($w[$idx],1).ToUpper() + $w.Substring($idx + 1)
      } else { $w }
    }
  }
  return ($out -join ' ')
}

function Escape-Sql([string]$s) { return $s -replace "'", "''" }

# --- Departamentos (unicos) --------------------------------------------------
$depts = @{}
foreach ($r in $rows) {
  $code = ([string]$r.$colDeptCod).Trim().PadLeft(2, '0')
  if (-not $depts.ContainsKey($code)) {
    $depts[$code] = ConvertTo-NombrePropio ([string]$r.$colDeptNom)
  }
}

# --- Municipios --------------------------------------------------------------
$munis = foreach ($r in $rows) {
  [pscustomobject]@{
    Code     = ([string]$r.$colMuniCod).Trim().PadLeft(5, '0')
    DeptCode = ([string]$r.$colDeptCod).Trim().PadLeft(2, '0')
    Name     = ConvertTo-NombrePropio ([string]$r.$colMuniNom)
    Kind     = if ($colTipo) { ([string]$r.$colTipo).Trim() } else { 'Municipio' }
  }
}
$munis = $munis | Sort-Object Code -Unique

Write-Host "Departamentos: $($depts.Count)  |  Municipios: $($munis.Count)"

# --- Construccion del SQL ----------------------------------------------------
$sb = [System.Text.StringBuilder]::new()
$null = $sb.AppendLine(@"
-- Divipola: departamentos y municipios oficiales de Colombia.
--
-- Reemplaza la lista fija de ciudades que vivia en src/lib/data.ts.
-- El formulario usa un selector en cascada: primero departamento, luego
-- municipio filtrado por ese departamento. Es un conjunto cerrado y oficial,
-- por eso NO vive en la tabla `tags` y no admite propuestas de usuarios.
--
-- Fuente: DANE / datos.gov.co, dataset gdxc-w37w (actualizado 2024-12-30).
-- Licencia CC BY-SA 4.0.
-- Generado por scripts/gen-divipola.ps1 -- no editar a mano.
--
-- Se incluyen las areas no municipalizadas de Amazonas, Guainia y Vaupes:
-- son lugares donde vive gente y excluirlas dejaria artistas sin poder
-- registrarse, que es justo el problema que estamos resolviendo.

create table if not exists public.departments (
  code text primary key,
  name text not null unique
);

create table if not exists public.municipalities (
  code            text primary key,
  department_code text not null references public.departments(code) on delete restrict,
  name            text not null,
  kind            text not null default 'Municipio',
  unique (department_code, name)
);

create index if not exists municipalities_department_code_idx
  on public.municipalities (department_code);

-- Busqueda por nombre en el selector
create index if not exists municipalities_name_idx
  on public.municipalities (lower(name));

"@)

$null = $sb.AppendLine("insert into public.departments (code, name) values")
$deptLines = foreach ($k in ($depts.Keys | Sort-Object)) {
  "  ('$k', '$(Escape-Sql $depts[$k])')"
}
$null = $sb.AppendLine(($deptLines -join ",`n"))
$null = $sb.AppendLine("on conflict (code) do update set name = excluded.name;")
$null = $sb.AppendLine()

$null = $sb.AppendLine("insert into public.municipalities (code, department_code, name, kind) values")
$muniLines = foreach ($m in $munis) {
  "  ('$($m.Code)', '$($m.DeptCode)', '$(Escape-Sql $m.Name)', '$(Escape-Sql $m.Kind)')"
}
$null = $sb.AppendLine(($muniLines -join ",`n"))
$null = $sb.AppendLine("on conflict (code) do update set")
$null = $sb.AppendLine("  department_code = excluded.department_code,")
$null = $sb.AppendLine("  name            = excluded.name,")
$null = $sb.AppendLine("  kind            = excluded.kind;")
$null = $sb.AppendLine()

$null = $sb.AppendLine(@"
-- Datos de referencia publicos: cualquiera puede leerlos para llenar el
-- selector, nadie puede escribirlos desde el cliente (no hay politica de
-- INSERT/UPDATE/DELETE, asi que RLS los bloquea por defecto).
alter table public.departments    enable row level security;
alter table public.municipalities enable row level security;

drop policy if exists public_select_departments on public.departments;
create policy public_select_departments on public.departments
  for select to anon, authenticated using (true);

drop policy if exists public_select_municipalities on public.municipalities;
create policy public_select_municipalities on public.municipalities
  for select to anon, authenticated using (true);
"@)

$dir = Split-Path $outFile -Parent
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
[System.IO.File]::WriteAllText((Resolve-Path -LiteralPath $dir).Path + "\20260811130000_divipola.sql", $sb.ToString(), [System.Text.UTF8Encoding]::new($false))

Write-Host "Migracion escrita."
Write-Host "Muestra de departamentos:"
($depts.Keys | Sort-Object | Select-Object -First 5) | ForEach-Object { Write-Host "  $_ -> $($depts[$_])" }
Write-Host "Muestra de municipios:"
$munis | Select-Object -First 5 | ForEach-Object { Write-Host "  $($_.Code) $($_.DeptCode) $($_.Name) [$($_.Kind)]" }
Write-Host "Tipos encontrados:"
$munis | Group-Object Kind | ForEach-Object { Write-Host "  $($_.Name): $($_.Count)" }

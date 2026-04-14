import { getArtistStats } from "@/lib/queries/artists";
import { formatPrice } from "@/lib/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

export default async function AdminDashboardPage() {
  const { total, active, pending, avgPrice, artists } = await getArtistStats();

  const stats = [
    { label: "Total Artistas", value: total, color: "text-chart-1", bg: "bg-chart-1/10" },
    { label: "Activos", value: active, color: "text-[var(--success)]", bg: "bg-[var(--success-bg)]" },
    { label: "Pendientes", value: pending, color: "text-[var(--warning)]", bg: "bg-[var(--warning-bg)]" },
    { label: "Precio Promedio", value: formatPrice(avgPrice), color: "text-chart-4", bg: "bg-chart-4/10" },
  ];

  const typeCounts = artists.reduce<Record<string, number>>((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {});
  const typeEntries = Object.entries(typeCounts).sort(([, a], [, b]) => b - a);
  const maxTypeCount = Math.max(...Object.values(typeCounts), 1);

  const recentArtists = [...artists]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumen general del directorio de artistas</p>
      </div>

      <div className="grid grid-cols-1 gap-px rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={stat.label}
            className={`rounded-none border-0 shadow-none ring-0 ${i === 0 ? "rounded-t-xl sm:rounded-tl-xl sm:rounded-tr-none" : ""} ${i === stats.length - 1 ? "rounded-b-xl sm:rounded-br-xl sm:rounded-bl-none" : ""}`}>
            <CardContent className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 p-4 sm:p-6">
              <div className="inline-flex items-center gap-2 text-sm font-medium">
                <span className={`inline-flex size-2 rounded-full ${stat.bg} ring-2 ring-current ${stat.color}`} />
                <span className="text-muted-foreground">{stat.label}</span>
              </div>
              <div className={`w-full flex-none text-3xl font-medium tracking-tight tabular-nums ${stat.color}`}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Artistas por Profesión</CardTitle>
            <CardDescription>Distribución por tipo de artista</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {typeEntries.map(([type, count]) => (
                <div key={type} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{type}</span>
                    <span className="tabular-nums text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(count / maxTypeCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Artistas Recientes</CardTitle>
            <CardDescription>Últimos registros</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {recentArtists.map((artist) => (
                <div key={artist.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                    {artist.photo ? (
                      <Image src={artist.photo} alt={artist.name} fill className="object-cover" sizes="40px" />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-muted text-sm font-bold text-muted-foreground">{artist.name.charAt(0)}</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{artist.name}</p>
                    <p className="text-xs text-muted-foreground">{artist.city} · {formatDate(artist.created_at)}</p>
                  </div>
                  <Badge variant="secondary">{artist.type}</Badge>
                </div>
              ))}
              {recentArtists.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No hay artistas registrados aún</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { artists, formatPrice } from "@/lib/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

const stats = [
  {
    label: "Total Artistas",
    value: artists.length,
  },
  {
    label: "Activos",
    value: artists.filter((a) => a.active).length,
  },
  {
    label: "Pendientes",
    value: artists.filter((a) => a.status === "Pendiente").length,
  },
  {
    label: "Precio Promedio",
    value: formatPrice(
      artists.reduce((sum, a) => sum + a.price, 0) / artists.length
    ),
  },
];

const typeCounts = artists.reduce<Record<string, number>>((acc, a) => {
  acc[a.type] = (acc[a.type] || 0) + 1;
  return acc;
}, {});

const typeEntries = Object.entries(typeCounts).sort(([, a], [, b]) => b - a);
const maxTypeCount = Math.max(...Object.values(typeCounts));

const recentArtists = [...artists]
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  .slice(0, 5);

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumen general del directorio de artistas
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card
            key={stat.label}
            className={`rounded-none border-0 shadow-none ring-0 ${
              i === 0 ? "rounded-t-xl sm:rounded-tl-xl sm:rounded-tr-none lg:rounded-tr-none" : ""
            } ${
              i === stats.length - 1
                ? "rounded-b-xl sm:rounded-br-xl sm:rounded-bl-none lg:rounded-bl-none"
                : ""
            }`}
          >
            <CardContent className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 p-4 sm:p-6">
              <div className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </div>
              <div className="w-full flex-none text-3xl font-medium tracking-tight tabular-nums">
                {stat.value}
              </div>
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
                    <span className="tabular-nums text-muted-foreground">
                      {count}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${(count / maxTypeCount) * 100}%`,
                      }}
                    />
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
                <div
                  key={artist.id}
                  className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                    <Image
                      src={artist.photo}
                      alt={artist.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {artist.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {artist.city} · {formatDate(artist.createdAt)}
                    </p>
                  </div>
                  <Badge variant="secondary">{artist.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

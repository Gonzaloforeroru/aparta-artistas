"use client"

import { useMemo } from "react"
import {
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
  Label,
  PolarAngleAxis,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { artists, formatPrice } from "@/lib/data"
import type { Artist } from "@/lib/data"
import {
  BarChart3Icon,
  PieChartIcon,
  ActivityIcon,
  TrendingUpIcon,
  ShareIcon,
  MusicIcon,
} from "lucide-react"

function countBy<T>(items: T[], key: (item: T) => string) {
  const map = new Map<string, number>()
  for (const item of items) {
    const k = key(item)
    map.set(k, (map.get(k) ?? 0) + 1)
  }
  return Array.from(map, ([name, count]) => ({ name, count }))
}

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const

const STATUS_COLORS: Record<string, string> = {
  Aprobado: "var(--success)",
  Pendiente: "var(--warning)",
  Rechazado: "var(--error)",
}

const cityConfig: ChartConfig = {
  count: { label: "Artistas", color: "var(--chart-1)" },
}

const statusConfig: ChartConfig = {
  Aprobado: { label: "Aprobado", color: "var(--success)" },
  Pendiente: { label: "Pendiente", color: "var(--warning)" },
  Rechazado: { label: "Rechazado", color: "var(--error)" },
}

const priceConfig: ChartConfig = {
  price: { label: "Precio", color: "var(--chart-1)" },
}

const socialConfig: ChartConfig = {
  count: { label: "Artistas", color: "var(--chart-2)" },
}

const genreConfig: ChartConfig = {
  count: { label: "Artistas", color: "var(--chart-3)" },
}

export default function MetricasPage() {
  const cityData = useMemo(
    () => countBy(artists, (a) => a.city).sort((a, b) => b.count - a.count),
    []
  )

  const typeData = useMemo(
    () => countBy(artists, (a) => a.type).sort((a, b) => b.count - a.count),
    []
  )

  const typeConfig: ChartConfig = useMemo(() => {
    const config: ChartConfig = {}
    typeData.forEach((item, i) => {
      config[item.name] = {
        label: item.name,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }
    })
    return config
  }, [typeData])

  const statusData = useMemo(() => {
    const counts = countBy(artists, (a) => a.status)
    return counts.map((item) => ({
      ...item,
      fill: STATUS_COLORS[item.name] ?? "var(--chart-1)",
    }))
  }, [])

  const priceData = useMemo(
    () =>
      [...artists]
        .sort((a, b) => a.price - b.price)
        .map((a) => ({
          name: a.name.split(" ")[0],
          price: a.price,
          fullName: a.name,
        })),
    []
  )

  const socialData = useMemo(() => {
    const platforms = [
      { name: "Instagram", key: "instagram" as keyof Artist },
      { name: "TikTok", key: "tiktok" as keyof Artist },
      { name: "YouTube", key: "youtube" as keyof Artist },
      { name: "Spotify", key: "spotify" as keyof Artist },
    ]
    return platforms.map((p) => ({
      name: p.name,
      count: artists.filter((a) => a[p.key]).length,
      percentage: Math.round(
        (artists.filter((a) => a[p.key]).length / artists.length) * 100
      ),
    }))
  }, [])

  const genreData = useMemo(
    () => countBy(artists, (a) => a.genre).sort((a, b) => b.count - a.count),
    []
  )

  const totalArtists = artists.length

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Métricas</h1>
          <p className="text-sm text-muted-foreground">
            Análisis detallado del directorio de artistas
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ActivityIcon className="size-3.5" />
          <span>{totalArtists} artistas registrados</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-chart-1/10">
                <BarChart3Icon className="size-4 text-chart-1" />
              </div>
              <div>
                <CardTitle>Artistas por Ciudad</CardTitle>
                <CardDescription>
                  Distribución geográfica en Colombia
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={cityConfig} className="h-[300px] w-full">
              <BarChart
                data={cityData}
                layout="vertical"
                margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
              >
                <CartesianGrid
                  horizontal={false}
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  strokeOpacity={0.5}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <ChartTooltip
                  content={<ChartTooltipContent hideLabel={false} />}
                />
                <Bar
                  dataKey="count"
                  radius={[0, 8, 8, 0]}
                  fill="var(--chart-1)"
                  maxBarSize={36}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-chart-2/10">
                <PieChartIcon className="size-4 text-chart-2" />
              </div>
              <div>
                <CardTitle>Distribución por Profesión</CardTitle>
                <CardDescription>Tipos de artistas registrados</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={typeConfig} className="h-[300px] w-full">
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="name" hideLabel />}
                />
                <Pie
                  data={typeData}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={110}
                  strokeWidth={3}
                  stroke="var(--card)"
                  paddingAngle={2}
                >
                  {typeData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy ?? 0) - 8}
                              className="fill-foreground text-3xl font-bold"
                            >
                              {totalArtists}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy ?? 0) + 14}
                              className="fill-muted-foreground text-xs"
                            >
                              Artistas
                            </tspan>
                          </text>
                        )
                      }
                      return null
                    }}
                  />
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-chart-3/10">
                <ActivityIcon className="size-4 text-chart-3" />
              </div>
              <div>
                <CardTitle>Estado de Artistas</CardTitle>
                <CardDescription>
                  Aprobación, pendientes y rechazados
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={statusConfig} className="h-[300px] w-full">
              <RadialBarChart
                data={statusData}
                innerRadius={40}
                outerRadius={140}
                startAngle={180}
                endAngle={0}
              >
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="name" hideLabel />}
                />
                <PolarAngleAxis
                  type="number"
                  domain={[0, Math.max(...statusData.map((d) => d.count))]}
                  tick={false}
                />
                <RadialBar
                  dataKey="count"
                  cornerRadius={10}
                  background={{ fill: "var(--muted)" }}
                />
                <ChartLegend
                  content={<ChartLegendContent nameKey="name" />}
                  verticalAlign="bottom"
                />
              </RadialBarChart>
            </ChartContainer>
            <div className="mt-2 flex items-center justify-center gap-6">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="size-3 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-sm font-medium">{item.count}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-chart-4/10">
                <TrendingUpIcon className="size-4 text-chart-4" />
              </div>
              <div>
                <CardTitle>Rango de Precios</CardTitle>
                <CardDescription>
                  Distribución de tarifas en COP (ordenado ascendente)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={priceConfig} className="h-[300px] w-full">
              <AreaChart
                data={priceData}
                margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
              >
                <defs>
                  <linearGradient
                    id="priceGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  strokeOpacity={0.5}
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value: number) =>
                    `$${(value / 1000).toFixed(0)}k`
                  }
                  width={50}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatPrice(value as number)}
                      labelFormatter={(label, payload) => {
                        const item = payload?.[0]?.payload as
                          | { fullName: string }
                          | undefined
                        return item?.fullName ?? label
                      }}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  fill="url(#priceGradient)"
                  dot={{
                    r: 4,
                    fill: "var(--chart-1)",
                    stroke: "var(--card)",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 6,
                    fill: "var(--chart-1)",
                    stroke: "var(--card)",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-chart-5/10">
                <ShareIcon className="size-4 text-chart-5" />
              </div>
              <div>
                <CardTitle>Cobertura de Redes Sociales</CardTitle>
                <CardDescription>
                  Plataformas conectadas por los artistas
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={socialConfig} className="h-[300px] w-full">
              <BarChart
                data={socialData}
                layout="vertical"
                margin={{ left: 8, right: 32, top: 8, bottom: 8 }}
              >
                <CartesianGrid
                  horizontal={false}
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  strokeOpacity={0.5}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={80}
                  tick={{ fontSize: 12 }}
                />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  domain={[0, totalArtists]}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name, item) => {
                        const pct = (item.payload as { percentage: number })
                          .percentage
                        return `${value} artistas (${pct}%)`
                      }}
                    />
                  }
                />
                <Bar
                  dataKey="count"
                  radius={[0, 8, 8, 0]}
                  maxBarSize={32}
                >
                  {socialData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              {socialData.map((item, i) => (
                <div
                  key={item.name}
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1"
                >
                  <div
                    className="size-2.5 rounded-full"
                    style={{
                      backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                    }}
                  />
                  <span className="text-xs font-medium">{item.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-chart-1/10">
                <MusicIcon className="size-4 text-chart-1" />
              </div>
              <div>
                <CardTitle>Artistas por Género Musical</CardTitle>
                <CardDescription>
                  Géneros más populares en el directorio
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={genreConfig} className="h-[300px] w-full">
              <BarChart
                data={genreData}
                margin={{ left: 0, right: 8, top: 8, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  strokeOpacity={0.5}
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  allowDecimals={false}
                />
                <ChartTooltip
                  content={<ChartTooltipContent hideLabel={false} />}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={48}>
                  {genreData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

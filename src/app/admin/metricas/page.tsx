import { getAllArtists } from "@/lib/queries/artists";
import { MetricasCharts } from "./metricas-charts";

export default async function MetricasPage() {
  const artists = await getAllArtists();
  return <MetricasCharts artists={artists} />;
}

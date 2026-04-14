import { getPendingArtists } from "@/lib/queries/artists";
import { AprobacionesContent } from "./aprobaciones-content";

export default async function AdminAprobacionesPage() {
  const pendingArtists = await getPendingArtists();
  return <AprobacionesContent artists={pendingArtists} />;
}

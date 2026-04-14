import { getApprovedArtists } from "@/lib/queries/artists";
import { CatalogoContent } from "./catalogo-content";

export default async function CatalogoPage() {
  const artists = await getApprovedArtists();

  return (
    <div className="min-h-screen bg-background">
      <CatalogoContent artists={artists} />
    </div>
  );
}

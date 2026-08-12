import { getAllArtists } from "@/lib/queries/artists";
import { getAssociations } from "@/lib/queries/associations";
import { ListaContent } from "./lista-content";

export default async function AdminListaPage() {
  const [artists, associations] = await Promise.all([
    getAllArtists(),
    getAssociations(),
  ]);
  return <ListaContent artists={artists} associations={associations} />;
}

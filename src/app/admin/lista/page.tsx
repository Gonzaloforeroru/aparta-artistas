import { getAllArtists } from "@/lib/queries/artists";
import { ListaContent } from "./lista-content";

export default async function AdminListaPage() {
  const artists = await getAllArtists();
  return <ListaContent artists={artists} />;
}

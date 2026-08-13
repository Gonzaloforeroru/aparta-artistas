import { getAllArtists } from "@/lib/queries/artists";
import { getAssociations } from "@/lib/queries/associations";
import { getOfficialTagsByKind } from "@/lib/queries/tags";
import { ListaContent } from "./lista-content";

export default async function AdminListaPage() {
  const [artists, associations, tagsByKind] = await Promise.all([
    getAllArtists(),
    getAssociations(),
    getOfficialTagsByKind(["artist_type", "genre"]),
  ]);
  return (
    <ListaContent
      artists={artists}
      associations={associations}
      typeOptions={tagsByKind.artist_type}
    />
  );
}

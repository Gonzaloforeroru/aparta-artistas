import { getArtistById } from "@/lib/queries/artists";
import { getAssociations } from "@/lib/queries/associations";
import { getOfficialTagsByKind } from "@/lib/queries/tags";
import { CrearContent } from "./crear-content";

export default async function AdminCrearPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const [existingArtist, associations, tagsByKind] = await Promise.all([
    id ? getArtistById(id) : Promise.resolve(null),
    getAssociations(),
    getOfficialTagsByKind(["artist_type", "genre"]),
  ]);

  return (
    <CrearContent
      existingArtist={existingArtist}
      associations={associations}
      typeOptions={tagsByKind.artist_type}
      genreOptions={tagsByKind.genre}
    />
  );
}

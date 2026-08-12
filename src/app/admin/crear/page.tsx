import { getArtistById } from "@/lib/queries/artists";
import { getAssociations } from "@/lib/queries/associations";
import { CrearContent } from "./crear-content";

export default async function AdminCrearPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const [existingArtist, associations] = await Promise.all([
    id ? getArtistById(id) : Promise.resolve(null),
    getAssociations(),
  ]);

  return <CrearContent existingArtist={existingArtist} associations={associations} />;
}

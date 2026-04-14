import { getArtistById } from "@/lib/queries/artists";
import { CrearContent } from "./crear-content";

export default async function AdminCrearPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const existingArtist = id ? await getArtistById(id) : null;

  return <CrearContent existingArtist={existingArtist} />;
}

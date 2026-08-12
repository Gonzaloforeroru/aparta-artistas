import { notFound } from "next/navigation";
import { getMyArtistProfile } from "@/app/artista/actions";
import { ensureArtistProfile } from "@/lib/auth/ensure-artist";
import { getPlacesForCascade } from "@/lib/queries/places";
import { getOfficialTagsByKind, getArtistTags } from "@/lib/queries/tags";
import { EditarForm } from "@/app/artista/editar/editar-form";

export default async function CompletarPerfilPage() {
  // Never redirect to /login on a missing record: the session is valid, so
  // /login bounces straight back here and the browser loops. Pages render in
  // parallel with the layout, so this page has to self-heal on its own instead
  // of trusting the layout to have done it already.
  const artist = (await getMyArtistProfile()) ?? (await ensureArtistProfile());

  if (!artist) notFound();

  // No completeness guard here on purpose: this page is the destination of the
  // guards in /artista and /artista/editar. Adding one would let the page
  // redirect to itself, which is exactly the bug 5bdb30b fixed.

  const [places, tagOptions, artistTags] = await Promise.all([
    getPlacesForCascade(),
    getOfficialTagsByKind(),
    getArtistTags(artist.id),
  ]);

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight">
          Completar perfil
        </h1>
        <p className="text-sm text-muted-foreground">
          Completa tu información para continuar
        </p>
      </div>
      <EditarForm
        artist={artist}
        mode="completar"
        departments={places.departments}
        municipalities={places.municipalities}
        tagOptions={tagOptions}
        artistTags={artistTags}
      />
    </div>
  );
}

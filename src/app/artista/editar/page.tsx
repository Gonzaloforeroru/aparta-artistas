import { notFound } from "next/navigation";
import { getMyArtistProfile } from "@/app/artista/actions";
import { ensureArtistProfile } from "@/lib/auth/ensure-artist";
import { EditarForm } from "./editar-form";

export default async function EditarPerfilPage() {
  // Never redirect to /login on a missing record: the session is valid, so
  // /login bounces straight back here and the browser loops. Pages render in
  // parallel with the layout, so this page has to self-heal on its own instead
  // of trusting the layout to have done it already.
  const artist = (await getMyArtistProfile()) ?? (await ensureArtistProfile());

  if (!artist) notFound();

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight">Editar perfil</h1>
        <p className="text-sm text-muted-foreground">
          Modifica tu información de artista
        </p>
      </div>
      <EditarForm artist={artist} mode="editar" />
    </div>
  );
}

import { redirect } from "next/navigation";
import { getMyArtistProfile } from "@/app/artista/actions";
import { EditarForm } from "./editar-form";

export default async function EditarPerfilPage() {
  const artist = await getMyArtistProfile();

  if (!artist) redirect("/login");

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

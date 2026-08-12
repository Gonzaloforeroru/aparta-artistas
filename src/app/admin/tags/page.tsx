import {
  getPendingTags,
  getPendingBadgeClaims,
  getTagCatalog,
} from "@/lib/queries/tags";
import { TagsContent } from "./tags-content";

export default async function AdminTagsPage() {
  const [pendingTags, pendingBadgeClaims, catalogTags] = await Promise.all([
    getPendingTags(),
    getPendingBadgeClaims(),
    // includeArchived es obligatorio: el toggle "Mostrar archivados" del
    // cliente filtra sobre este array. Sin el, los tags archivados no llegan
    // nunca al navegador, el toggle no muestra nada y unarchiveTag queda
    // inalcanzable, es decir, archivar seria irreversible desde la interfaz.
    getTagCatalog({ includeArchived: true }),
  ]);

  return (
    <TagsContent
      pendingTags={pendingTags}
      pendingBadgeClaims={pendingBadgeClaims}
      catalogTags={catalogTags}
    />
  );
}

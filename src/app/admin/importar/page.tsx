import { getOfficialTagsByKind } from "@/lib/queries/tags";
import { ImportarContent } from "./importar-content";

export default async function AdminImportarPage() {
  const tagsByKind = await getOfficialTagsByKind(["artist_type", "genre"]);

  const validTypes = tagsByKind.artist_type.map((t) => t.name);
  const validGenres = tagsByKind.genre.map((t) => t.name);

  return <ImportarContent validTypes={validTypes} validGenres={validGenres} />;
}

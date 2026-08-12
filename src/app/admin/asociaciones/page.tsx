import { getAssociations } from "@/lib/queries/associations";
import { AsociacionesContent } from "./asociaciones-content";

export default async function AdminAsociacionesPage() {
  const associations = await getAssociations();
  return <AsociacionesContent associations={associations} />;
}

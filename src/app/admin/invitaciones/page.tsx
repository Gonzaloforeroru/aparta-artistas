import { getInvitations } from "@/app/admin/actions";
import { getAssociations } from "@/lib/queries/associations";
import { InvitacionesContent } from "./invitaciones-content";

export default async function AdminInvitacionesPage() {
  const [invitations, associations] = await Promise.all([
    getInvitations(),
    getAssociations(),
  ]);
  return (
    <InvitacionesContent
      invitations={invitations}
      associations={associations}
    />
  );
}

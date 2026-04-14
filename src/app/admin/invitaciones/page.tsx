import { getInvitations } from "@/app/admin/actions";
import { InvitacionesContent } from "./invitaciones-content";

export default async function AdminInvitacionesPage() {
  const invitations = await getInvitations();
  return <InvitacionesContent invitations={invitations} />;
}

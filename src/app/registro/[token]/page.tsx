import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RegistroForm } from "./registro-form";

export default async function RegistroTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Validate token server-side
  const supabase = await createClient();
  const { data: invitation } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!invitation) {
    notFound();
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4 py-12">
      <RegistroForm token={token} />
    </div>
  );
}

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
    <div className="relative flex min-h-svh items-start justify-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-0 h-full w-full">
        <div className="absolute -top-[300px] -left-[200px] h-[800px] w-[800px] rounded-full bg-[#6E2FE3] opacity-20 blur-[150px]" />
        <div className="absolute top-[40%] right-[-100px] h-[600px] w-[600px] rounded-full bg-[#F31A7C] opacity-15 blur-[140px]" />
        <div className="absolute bottom-[10%] left-[20%] h-[500px] w-[500px] rounded-full bg-[#0CABF7] opacity-10 blur-[130px]" />
      </div>
      <div className="relative z-10 w-full max-w-2xl">
        <RegistroForm token={token} />
      </div>
    </div>
  );
}

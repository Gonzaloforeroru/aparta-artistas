import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RegistroTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Validate token server-side
  const supabase = await createClient();
  const { data: invitation, error } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .single();

  // Determine error type and show appropriate message
  if (!invitation) {
    if (error?.code === "PGRST116") {
      // Token not found
      return (
        <div className="relative flex min-h-svh items-start justify-center overflow-hidden bg-background px-4 py-12">
          <div className="pointer-events-none absolute inset-0 h-full w-full">
            <div className="absolute -top-[300px] -left-[200px] h-[800px] w-[800px] rounded-full bg-[#6E2FE3] opacity-20 blur-[150px]" />
            <div className="absolute top-[40%] right-[-100px] h-[600px] w-[600px] rounded-full bg-[#F31A7C] opacity-15 blur-[140px]" />
            <div className="absolute bottom-[10%] left-[20%] h-[500px] w-[500px] rounded-full bg-[#0CABF7] opacity-10 blur-[130px]" />
          </div>
          <div className="relative z-10 w-full max-w-2xl text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Enlace de invitación inválido
            </h1>
            <p className="text-muted-foreground">
              El enlace que intentas usar no existe o es incorrecto.
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="relative flex min-h-svh items-start justify-center overflow-hidden bg-background px-4 py-12">
        <div className="pointer-events-none absolute inset-0 h-full w-full">
          <div className="absolute -top-[300px] -left-[200px] h-[800px] w-[800px] rounded-full bg-[#6E2FE3] opacity-20 blur-[150px]" />
          <div className="absolute top-[40%] right-[-100px] h-[600px] w-[600px] rounded-full bg-[#F31A7C] opacity-15 blur-[140px]" />
          <div className="absolute bottom-[10%] left-[20%] h-[500px] w-[500px] rounded-full bg-[#0CABF7] opacity-10 blur-[130px]" />
        </div>
        <div className="relative z-10 w-full max-w-2xl text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Enlace de invitación inválido
          </h1>
          <p className="text-muted-foreground">
            El enlace que intentas usar no existe o es incorrecto.
          </p>
        </div>
      </div>
    );
  }

  // Check if token is expired
  if (new Date(invitation.expires_at) < new Date()) {
    return (
      <div className="relative flex min-h-svh items-start justify-center overflow-hidden bg-background px-4 py-12">
        <div className="pointer-events-none absolute inset-0 h-full w-full">
          <div className="absolute -top-[300px] -left-[200px] h-[800px] w-[800px] rounded-full bg-[#6E2FE3] opacity-20 blur-[150px]" />
          <div className="absolute top-[40%] right-[-100px] h-[600px] w-[600px] rounded-full bg-[#F31A7C] opacity-15 blur-[140px]" />
          <div className="absolute bottom-[10%] left-[20%] h-[500px] w-[500px] rounded-full bg-[#0CABF7] opacity-10 blur-[130px]" />
        </div>
        <div className="relative z-10 w-full max-w-2xl text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Este enlace ha expirado
          </h1>
          <p className="text-muted-foreground">
            El enlace de invitación ya no es válido. Por favor, solicita uno nuevo.
          </p>
        </div>
      </div>
    );
  }

  // Check if token has already been used
  if (invitation.used_at) {
    return (
      <div className="relative flex min-h-svh items-start justify-center overflow-hidden bg-background px-4 py-12">
        <div className="pointer-events-none absolute inset-0 h-full w-full">
          <div className="absolute -top-[300px] -left-[200px] h-[800px] w-[800px] rounded-full bg-[#6E2FE3] opacity-20 blur-[150px]" />
          <div className="absolute top-[40%] right-[-100px] h-[600px] w-[600px] rounded-full bg-[#F31A7C] opacity-15 blur-[140px]" />
          <div className="absolute bottom-[10%] left-[20%] h-[500px] w-[500px] rounded-full bg-[#0CABF7] opacity-10 blur-[130px]" />
        </div>
        <div className="relative z-10 w-full max-w-2xl text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Este enlace ya fue utilizado
          </h1>
          <p className="text-muted-foreground">
            Este enlace de invitación ya ha sido usado. Por favor, solicita uno nuevo.
          </p>
        </div>
      </div>
    );
  }

  // Token is valid - redirect to login with token
  redirect(`/login?token=${token}`);
}

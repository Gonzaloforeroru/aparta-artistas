import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function ErrorPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="relative flex min-h-svh items-start justify-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-0 h-full w-full">
        <div className="absolute -top-[300px] -left-[200px] h-[800px] w-[800px] rounded-full bg-[#6E2FE3] opacity-20 blur-[150px]" />
        <div className="absolute top-[40%] right-[-100px] h-[600px] w-[600px] rounded-full bg-[#F31A7C] opacity-15 blur-[140px]" />
        <div className="absolute bottom-[10%] left-[20%] h-[500px] w-[500px] rounded-full bg-[#0CABF7] opacity-10 blur-[130px]" />
      </div>
      <div className="relative z-10 w-full max-w-2xl text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

const REASON_MESSAGES: Record<string, { title: string; description: string }> = {
  not_found: {
    title: "Enlace de invitación inválido",
    description: "El enlace que intentas usar no existe o es incorrecto.",
  },
  expired: {
    title: "Este enlace ha caducado",
    description: "El enlace de invitación ya no es válido. Por favor, solicita uno nuevo.",
  },
  already_used: {
    title: "Este enlace ya fue utilizado",
    description: "Este enlace de invitación ya ha sido usado. Por favor, solicita uno nuevo.",
  },
  exhausted: {
    title: "Cupo agotado",
    description: "Este enlace de invitación ha alcanzado su límite de usos. Por favor, solicita uno nuevo.",
  },
};

export default async function RegistroTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("validate_invitation", {
    p_token: token,
  });

  if (error) {
    return (
      <ErrorPage
        title="Error al validar la invitación"
        description="Ocurrió un error inesperado. Inténtalo más tarde."
      />
    );
  }

  const row = Array.isArray(data) ? data[0] : data;

  if (!row?.valid) {
    const reason = row?.reason ?? "not_found";
    const msg = REASON_MESSAGES[reason] ?? REASON_MESSAGES.not_found;
    return <ErrorPage title={msg.title} description={msg.description} />;
  }

  // Build redirect URL with association info if present
  const searchParams = new URLSearchParams({ token });
  if (row.association_name) {
    searchParams.set("association", row.association_name);
  }

  redirect(`/login?${searchParams.toString()}`);
}

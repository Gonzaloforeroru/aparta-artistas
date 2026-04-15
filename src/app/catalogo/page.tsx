import Link from "next/link";
import { getApprovedArtists } from "@/lib/queries/artists";
import { CatalogoContent } from "./catalogo-content";
import { Button } from "@/components/ui/button";

export default async function CatalogoPage() {
  const artists = await getApprovedArtists();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Gradient blobs */}
      <div className="pointer-events-none absolute inset-0 h-full w-full">
        <div className="absolute -top-[300px] -left-[200px] h-[800px] w-[800px] rounded-full bg-[#6E2FE3] opacity-20 blur-[150px]" />
        <div className="absolute top-[40%] right-[-100px] h-[600px] w-[600px] rounded-full bg-[#F31A7C] opacity-15 blur-[140px]" />
        <div className="absolute bottom-[10%] left-[20%] h-[500px] w-[500px] rounded-full bg-[#0CABF7] opacity-10 blur-[130px]" />
      </div>

      <div className="relative z-10">
        {/* Public navbar */}
        <nav className="flex h-[52px] items-center justify-between px-6">
          <Link
            href="/catalogo"
            className="font-heading text-base font-semibold text-foreground"
          >
            Apparta
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/catalogo"
              className="text-sm font-medium text-[var(--text-tertiary)] transition-colors hover:text-foreground"
            >
              Explorar
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm">
                Iniciar sesión
              </Button>
            </Link>
          </div>
        </nav>

        <CatalogoContent artists={artists} />
      </div>
    </div>
  );
}

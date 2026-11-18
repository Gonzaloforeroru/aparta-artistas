import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // El alta/edición de artistas envía la foto dentro del FormData de un Server
  // Action. El límite por defecto de Next (1 MB) rechazaba las fotos normales
  // con "Body exceeded 1 MB limit" (y la UI se quedaba en "Error al guardar
  // artista"). Se sube a 8 MB para admitir fotos de hasta ~5 MB como indica el
  // formulario, con algo de holgura para el resto del formulario.
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "fplrquayqyudqrwvnlze.supabase.co",
      },
    ],
  },
};

export default nextConfig;

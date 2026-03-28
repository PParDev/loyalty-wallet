import type { NextConfig } from "next";

const securityHeaders = [
  // Impide que la app se cargue dentro de un <iframe> en otros dominios
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Impide que el navegador adivine el tipo de contenido (MIME sniffing)
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Controla cuánta información de referencia se envía al navegar
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Permisos de APIs del navegador: solo cámara (para el escáner QR), resto desactivado
  { key: "Permissions-Policy", value: "camera=(self), geolocation=(), microphone=()" },
  // Fuerza HTTPS por 2 años (solo activo en producción con SSL)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  serverExternalPackages: ["@prisma/client"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

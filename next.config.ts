import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Painel autenticado com cookies/Supabase: modo clássico evita erros de prerender.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

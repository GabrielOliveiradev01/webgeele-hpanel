import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

const PUBLIC_PAGES = ["/cadastro", "/login", "/llms.txt", "/opengraph-image"];

// Robôs de busca e de assistentes de IA que podem ler e citar as páginas públicas.
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
];

// Só as páginas públicas são indexadas; o painel e a API ficam de fora.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: PUBLIC_PAGES, disallow: "/" },
      { userAgent: AI_BOTS, allow: PUBLIC_PAGES, disallow: "/" },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}

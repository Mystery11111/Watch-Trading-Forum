import { pathToFileURL } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

function seoSitemapPlugin() {
  let root = process.cwd();
  return {
    name: "seo-sitemap",
    apply: "build" as const,
    configResolved(config: { root: string }) {
      root = config.root;
    },
    async closeBundle() {
      try {
        const sitemapModule = pathToFileURL(path.join(root, "scripts/generate-sitemap.cjs")).href;
        const { generateSitemapFile } = await import(sitemapModule);
        await generateSitemapFile();
      } catch (error) {
        console.warn("[seo] sitemap generation failed:", error);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), seoSitemapPlugin()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },

  build: {
    outDir: "dist"
  },

  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8080",
      "/uploads": "http://localhost:8080"
    }
  }
});
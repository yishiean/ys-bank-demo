// @lovable.dev/vite-tanstack-config already includes tanstackStart, viteReact, tailwindcss,
// tsConfigPaths, nitro, env injection and the @ alias. Do NOT add them manually.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    server: { entry: "server" },
    // SPA mode: emit a static HTML shell so the app can be hosted on GitHub Pages.
    spa: { enabled: true },
  },
  vite: {
    // GitHub Pages serves from /<repo>/. The workflow sets PAGES_BASE; Lovable preview stays at "/".
    base: process.env.PAGES_BASE ?? "/",
  },
});

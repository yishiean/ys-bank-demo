// @lovable.dev/vite-tanstack-config already includes tanstackStart, viteReact, tailwindcss,
// tsConfigPaths, nitro, env injection and the @ alias. Do NOT add them manually.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Set by the GitHub Pages workflow. Unset in Lovable, so Lovable builds are unchanged.
const pagesBase = process.env.PAGES_BASE;

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    server: { entry: "server" },
    // SPA mode: emit a static HTML shell so the app can be hosted on GitHub Pages.
    spa: { enabled: true },
  },
  // GitHub Pages is static hosting, so skip the Cloudflare server build there.
  nitro: pagesBase ? false : undefined,
  vite: {
    // GitHub Pages serves from /<repo>/; Lovable preview stays at "/".
    base: pagesBase ?? "/",
  },
});

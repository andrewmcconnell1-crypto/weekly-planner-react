import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the built site works whether it's served from the domain
  // root (Netlify / Cloudflare / vite preview) or from a subpath
  // (GitHub Pages: /weekly-planner-react/).
  base: './',
  plugins: [react()],
  // globals: true lets React Testing Library auto-register its afterEach
  // cleanup, so component test DOM doesn't leak between cases.
  test: {
    globals: true,
  },
})

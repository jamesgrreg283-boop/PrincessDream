import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  /** Allow `NEXT_PUBLIC_*` (same names as Vercel/Next-style docs) in `import.meta.env`. */
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
})

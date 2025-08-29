import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  // Define environment variables explicitly for Vercel deployment
  define: {
    'import.meta.env.NEXT_PUBLIC_BACKEND_BASE': JSON.stringify(process.env.NEXT_PUBLIC_BACKEND_BASE),
  },
})

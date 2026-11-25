import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: {
    '@proma/ui/theme.css': fileURLToPath(new URL('../../packages/ui/src/workbench/theme.css', import.meta.url)),
    '@proma/shared/config': fileURLToPath(new URL('../../packages/shared/src/config/index.ts', import.meta.url)),
    '@proma/ui/brand/assets': fileURLToPath(new URL('../../packages/ui/src/brand/assets', import.meta.url)),
    '@proma/ui/brand': fileURLToPath(new URL('../../packages/ui/src/brand/index.tsx', import.meta.url)),
    '@proma/client': fileURLToPath(new URL('../../packages/client/src/index.ts', import.meta.url)),
    '@proma/protocol': fileURLToPath(new URL('../../packages/protocol/src/index.ts', import.meta.url)),
    '@proma/ui/workbench/frame.css': fileURLToPath(new URL('../../packages/ui/src/workbench/frame.css', import.meta.url)),
    '@proma/ui/workbench/frame': fileURLToPath(new URL('../../packages/ui/src/workbench/frame.tsx', import.meta.url)),
    '@proma/ui/workbench/heading.css': fileURLToPath(new URL('../../packages/ui/src/workbench/heading.css', import.meta.url)),
    '@proma/ui/workbench/heading': fileURLToPath(new URL('../../packages/ui/src/workbench/heading.tsx', import.meta.url)),
    '@proma/ui/workbench': fileURLToPath(new URL('../../packages/ui/src/workbench/index.tsx', import.meta.url)),
  } },
  server: { host: '127.0.0.1' },
  build: { target: 'es2022' },
})

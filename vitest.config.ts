import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    globals: true,
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/components/crystalGeometry.ts',
        'src/components/ParticleMorph.tsx',
        'src/components/DecryptedText.tsx',
        'src/components/ScrollFloat.tsx',
      ],
      exclude: ['src/main.tsx'],
    },
  },
})

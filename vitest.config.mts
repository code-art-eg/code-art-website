import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/int/**/*.int.spec.{ts,tsx}'],
    /**
     * The integration specs share one SQLite file, and Payload runs a dev schema push on
     * init. Running spec files in parallel let those collide (intermittent SQLITE_ERROR on
     * a cold run), so files run one at a time — the suite only takes a few seconds anyway.
     */
    fileParallelism: false,
  },
})

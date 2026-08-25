// Load .env files
import 'dotenv/config'

// Extra DOM matchers (toBeInTheDocument, toHaveAttribute, ...) for React Testing Library
import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// `globals` is disabled in vitest.config.mts, so RTL cannot auto-register its cleanup hook.
afterEach(() => {
  cleanup()
})

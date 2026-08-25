import { getPayload } from 'payload'
import type { Payload } from 'payload'

import config from '@/payload.config'

/**
 * Shared Payload Local API client for server components.
 * `getPayload` caches the instance internally, so this is cheap to call per request.
 */
export const getPayloadClient = async (): Promise<Payload> => {
  const payloadConfig = await config
  return getPayload({ config: payloadConfig })
}

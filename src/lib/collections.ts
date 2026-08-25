import type { WorkExperience } from '@/payload-types'

import { getPayloadClient } from './payload'

/**
 * Work experience entries, most recent first. Ongoing roles (no `endYear`) sort
 * above finished ones that started in the same year.
 */
export const getWorkExperience = async (): Promise<WorkExperience[]> => {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'work-experience',
      sort: ['-startYear', '-endYear'],
      limit: 100,
      depth: 0,
    })
    return docs
  } catch {
    return []
  }
}

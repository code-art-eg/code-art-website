import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const GET = async () => {
  const payload = await getPayload({
    config: configPromise,
  })

  const { totalDocs } = await payload.count({ collection: 'users' })

  return Response.json({
    message: 'This is an example of a custom route.',
    users: totalDocs,
  })
}

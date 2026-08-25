import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Projects } from './collections/Projects'
import { Skills } from './collections/Skills'
import { WorkExperience } from './collections/WorkExperience'
import { Bio } from './globals/Bio'
import { Footer } from './globals/Footer'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, WorkExperience, Skills, Projects],
  globals: [Bio, Footer],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URL || '',
    },
    /**
     * The dev server and the test/seed scripts open the same SQLite file at the same time.
     * WAL lets readers and writers coexist, and the busy timeout makes the loser of a write
     * race wait instead of failing immediately with SQLITE_BUSY.
     */
    wal: true,
    busyTimeout: 10_000,
  }),
  sharp,
  plugins: [],
})

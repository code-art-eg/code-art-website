import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

/**
 * `bun run build:static` renders the site through a throwaway build it then crawls, so that
 * build gets its own output directory (leaving the dev server's `.next` alone) and turns off
 * image optimisation — a folder of files has no optimiser to serve `/_next/image?...` from.
 */
const staticExport = process.env.STATIC_EXPORT === 'true'

const nextConfig: NextConfig = {
  distDir: staticExport ? '.next-static' : '.next',
  images: {
    unoptimized: staticExport,
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })

import { describe, expect, it } from 'vitest'

import {
  DEFAULT_PUBLISH_DIR,
  commitMessage,
  entriesToClear,
  publishOptions,
} from '../../scripts/publish'

describe('publishOptions', () => {
  it('publishes to the sibling repository and pushes by default', () => {
    expect(publishOptions([], {})).toEqual({ directory: DEFAULT_PUBLISH_DIR, push: true })
  })

  it('builds without touching the repository when told not to publish', () => {
    expect(publishOptions(['--no-publish'], {})).toEqual({ directory: null, push: false })
    expect(publishOptions(['--no-publish'], { STATIC_PUBLISH_DIR: '../elsewhere' })).toEqual({
      directory: null,
      push: false,
    })
  })

  it('treats an empty STATIC_PUBLISH_DIR as opting out, so CI can build only', () => {
    expect(publishOptions([], { STATIC_PUBLISH_DIR: '' })).toEqual({ directory: null, push: false })
  })

  it('publishes wherever STATIC_PUBLISH_DIR points', () => {
    expect(publishOptions([], { STATIC_PUBLISH_DIR: '/tmp/site' })).toEqual({
      directory: '/tmp/site',
      push: true,
    })
  })

  it('commits without pushing when asked', () => {
    expect(publishOptions(['--no-push'], {})).toEqual({
      directory: DEFAULT_PUBLISH_DIR,
      push: false,
    })
  })

  it('ignores flags it does not know', () => {
    expect(publishOptions(['--verbose'], {})).toEqual({
      directory: DEFAULT_PUBLISH_DIR,
      push: true,
    })
  })
})

describe('entriesToClear', () => {
  it('clears everything the previous build left behind', () => {
    expect(entriesToClear(['index.html', '404.html', 'blog', '_next'])).toEqual([
      'index.html',
      '404.html',
      'blog',
      '_next',
    ])
  })

  it('spares the repository it is publishing into', () => {
    expect(entriesToClear(['.git', 'index.html'])).toEqual(['index.html'])
  })

  it('keeps dotfiles that are part of the build, such as .nojekyll', () => {
    expect(entriesToClear(['.nojekyll', '.git', '.github'])).toEqual(['.nojekyll', '.github'])
  })

  it('has nothing to do in an empty repository', () => {
    expect(entriesToClear([])).toEqual([])
    expect(entriesToClear(['.git'])).toEqual([])
  })
})

describe('commitMessage', () => {
  it('summarises the build under a conventional subject', () => {
    const message = commitMessage({ pages: 11, assets: 12, media: 29 })

    expect(message.split('\n')[0]).toBe('chore: publish static site build')
    expect(message.split('\n')[1]).toBe('')
    expect(message).toContain('11 pages, 12 assets, 29 media files')
    expect(message).toContain('bun run build:static')
  })
})

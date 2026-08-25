import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export type MarkdownProps = {
  children: string
  className?: string
}

/**
 * Renders a Markdown string as HTML with GitHub-flavoured extensions (tables,
 * strikethrough, task lists, autolinks).
 *
 * Raw HTML in the source is *not* rendered — `react-markdown` escapes it unless
 * `rehype-raw` is added, which keeps CMS content from injecting markup.
 */
export const Markdown: React.FC<MarkdownProps> = ({ children, className }) => (
  <div
    className={
      className ??
      'prose prose-slate dark:prose-invert prose-a:text-sky-700 dark:prose-a:text-sky-400 prose-pre:bg-slate-900 max-w-none'
    }
  >
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children: linkChildren, ...props }) => {
          const isExternal = Boolean(href && /^https?:\/\//.test(href))
          return (
            <a
              href={href}
              {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              {...props}
            >
              {linkChildren}
            </a>
          )
        },
      }}
    >
      {children}
    </ReactMarkdown>
  </div>
)

export default Markdown

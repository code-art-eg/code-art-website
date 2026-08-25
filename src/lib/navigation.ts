export type NavItem = {
  /** id of the home page section this item scrolls to */
  id: string
  label: string
}

/** Sections of the home page exposed in the fixed main menu, in display order. */
export const navItems: NavItem[] = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
]

/**
 * Anchor href for a nav item: a bare hash on the home page (so the browser can
 * smooth-scroll) and a root-relative link from anywhere else.
 */
export const navHref = (id: string, pathname: string): string =>
  pathname === '/' ? `#${id}` : `/#${id}`
